import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEV_SESSION_COOKIE, SESSION_COOKIE, TIMEZONE_COOKIE, cleanTimezone, devAuthUrlFrom, sessionCookieOptions } from "./cookies";

/**
 * The access token jarlore-be accepts lives in the httpOnly `jarlore_session`
 * cookie and is only read on the server, which forwards it as a Bearer token.
 *
 * In production it is a Neon Auth JWT: src/proxy.ts mints it from the Neon Auth
 * session and refreshes it before it expires (15-minute tokens). In development it
 * can instead come from jarlore-be's local issuer (cmd/devauth). See
 * docs/architecture/FRONTEND_ARCHITECTURE.md, "Authentication".
 */
export { SESSION_COOKIE };

export async function getAccessToken(): Promise<string> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");
  return token;
}

/** The browser time zone recorded at sign-in, for jarlore-be's first profile. */
export async function getTimezoneHint(): Promise<string | null> {
  return cleanTimezone((await cookies()).get(TIMEZONE_COOKIE)?.value);
}

export async function rememberTimezone(tz: string | null) {
  const clean = cleanTimezone(tz);
  if (clean) (await cookies()).set(TIMEZONE_COOKIE, clean, sessionCookieOptions(60 * 60 * 24 * 365));
}

export async function setDevSession(token: string, maxAgeSeconds: number) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions(maxAgeSeconds));
  store.set(DEV_SESSION_COOKIE, "1", sessionCookieOptions(maxAgeSeconds));
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(DEV_SESSION_COOKIE);
}

/**
 * The development issuer, when configured. It is refused in production builds and
 * unless it is on this machine (loopback), so a misconfigured deployment cannot
 * accept tokens anyone can mint.
 */
export function devAuthUrl(): string | null {
  return devAuthUrlFrom(process.env.NODE_ENV, process.env.JARLORE_DEV_AUTH_URL);
}
