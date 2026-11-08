import { NextResponse, type NextRequest } from "next/server";
import {
  DEV_SESSION_COOKIE,
  REFRESH_MARGIN_SECONDS,
  SESSION_COOKIE,
  devAuthUrlFrom,
  secondsLeft,
  sessionCookieOptions,
} from "@/lib/auth/cookies";
import { NEON_SESSION_COOKIE, mintNeonToken, neonAuth } from "@/lib/auth/neon";

/**
 * Gate for the signed-in app. For every page and Server Action under the matcher:
 *
 * 1. The Neon Auth session is checked (and refreshed) by the SDK's middleware;
 *    without a valid session the visitor goes to /login?next=…
 * 2. The JWT jarlore-be accepts is kept in the httpOnly `jarlore_session` cookie and
 *    re-minted from the session when it has under two minutes left, so pages and
 *    actions always forward a live token. The proxy is the one place allowed to
 *    write cookies on a page request.
 *
 * This is not the security boundary: jarlore-be verifies the JWT's signature,
 * issuer, audience and expiry on every request.
 */
export async function proxy(request: NextRequest) {
  const jwt = request.cookies.get(SESSION_COOKIE)?.value;

  // Development sign-in (local issuer): nothing to refresh. Ignored in production.
  if (request.cookies.has(DEV_SESSION_COOKIE) && devAuthUrlFrom(process.env.NODE_ENV, process.env.JARLORE_DEV_AUTH_URL)) {
    return jwt ? NextResponse.next() : toLogin(request, false);
  }

  const auth = neonAuth();
  if (!auth || !request.cookies.has(NEON_SESSION_COOKIE)) return toLogin(request, Boolean(jwt));

  const checked = await neonMiddleware(auth)(request);
  const refreshed = checked.headers.getSetCookie();
  if (checked.headers.has("location")) return toLogin(request, true, refreshed);

  const left = secondsLeft(jwt);
  if (left !== null && left > REFRESH_MARGIN_SECONDS) return checked;

  const cookieHeader = applySetCookies(request.headers.get("cookie") ?? "", refreshed);
  let token: string | null;
  try {
    token = await mintNeonToken(cookieHeader, request.nextUrl.origin);
  } catch {
    // Neon Auth unreachable: keep a still-valid token; otherwise the page's API
    // call fails and the error boundary offers a retry.
    return checked;
  }
  if (!token) return toLogin(request, true, refreshed);

  // This request's render reads the new token; the browser stores it for the next.
  const headers = new Headers(request.headers);
  for (const [name, value] of checked.headers) {
    if (name.startsWith("x-middleware-request-")) headers.set(name.slice("x-middleware-request-".length), value);
  }
  headers.set("cookie", applySetCookies(cookieHeader, [`${SESSION_COOKIE}=${token}`]));
  const res = NextResponse.next({ request: { headers } });
  for (const c of refreshed) res.headers.append("Set-Cookie", c);
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(secondsLeft(token) ?? 900));
  return res;
}

let middleware: ((r: NextRequest) => Promise<NextResponse>) | null = null;
function neonMiddleware(auth: NonNullable<ReturnType<typeof neonAuth>>) {
  middleware ??= auth.middleware({ loginUrl: "/login" }) as (r: NextRequest) => Promise<NextResponse>;
  return middleware;
}

/** /login?next=<where they were going>, clearing the API token. */
function toLogin(request: NextRequest, expired: boolean, setCookies: string[] = []) {
  const url = request.nextUrl.clone();
  const next = request.nextUrl.pathname + request.nextUrl.search;
  url.pathname = "/login";
  url.search = "";
  if (next !== "/today") url.searchParams.set("next", next);
  if (expired) url.searchParams.set("expired", "1");
  const res = NextResponse.redirect(url);
  for (const c of setCookies) res.headers.append("Set-Cookie", c);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

/** Applies Set-Cookie values (name=value; attrs) to a Cookie request header. */
function applySetCookies(cookieHeader: string, setCookies: string[]): string {
  const jar = new Map<string, string>();
  for (const part of cookieHeader.split(";")) {
    const i = part.indexOf("=");
    if (i > 0) jar.set(part.slice(0, i).trim(), part.slice(i + 1).trim());
  }
  for (const sc of setCookies) {
    const [pair, ...attrs] = sc.split(";");
    const i = pair.indexOf("=");
    if (i <= 0) continue;
    const name = pair.slice(0, i).trim();
    const removed = attrs.some((a) => /^\s*max-age\s*=\s*0\s*$/i.test(a)) || pair.slice(i + 1).trim() === "";
    if (removed) jar.delete(name);
    else jar.set(name, pair.slice(i + 1).trim());
  }
  return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
}

export const config = {
  matcher: ["/today/:path*", "/batches/:path*", "/recipes/:path*", "/compare/:path*", "/me/:path*"],
};
