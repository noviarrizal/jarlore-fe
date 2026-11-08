import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * The access token lives in an httpOnly cookie and is only read on the server,
 * which forwards it to jarlore-be as a Bearer token. The browser never sees it in JS.
 *
 * Today the token comes from the local development issuer (jarlore-be `cmd/devauth`).
 * Production sign-in with Neon Auth (@neon/auth) plugs in here: return the Neon
 * Auth JWT for the current session instead of the cookie value, and nothing else
 * changes. See docs/architecture/FRONTEND_ARCHITECTURE.md, "Authentication".
 */
export const SESSION_COOKIE = "jarlore_session";

export async function getAccessToken(): Promise<string> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");
  return token;
}

export async function setSession(token: string, maxAgeSeconds: number) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The development issuer, when configured. Never set in production. */
export function devAuthUrl(): string | null {
  return process.env.NODE_ENV === "production" ? null : (process.env.JARLORE_DEV_AUTH_URL ?? null);
}
