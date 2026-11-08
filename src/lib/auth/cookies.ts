/**
 * Cookie names and helpers shared by src/proxy.ts and server code. Every cookie
 * here is httpOnly: the browser's JavaScript never reads a token.
 */

/** The JWT jarlore-be accepts (Neon Auth, or the local issuer in development). */
export const SESSION_COOKIE = "jarlore_session";

/** Set by development sign-in only; tells the proxy there is no Neon session to check. */
export const DEV_SESSION_COOKIE = "jarlore_dev_session";

/** The browser's IANA time zone, sent to jarlore-be when it creates the profile. */
export const TIMEZONE_COOKIE = "jarlore_tz";

/** Refresh the JWT when it has less than this left (Neon Auth tokens live 15 minutes). */
export const REFRESH_MARGIN_SECONDS = 120;

export const sessionCookieOptions = (maxAgeSeconds: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: Math.max(0, Math.floor(maxAgeSeconds)),
});

/**
 * Seconds until the JWT's `exp`, or null when it is not a JWT. This only decides
 * when to fetch a fresh token: the signature is verified by jarlore-be, never here.
 */
export function secondsLeft(jwt: string | undefined, nowMs = Date.now()): number | null {
  if (!jwt) return null;
  const parts = jwt.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const exp = (JSON.parse(json) as { exp?: unknown }).exp;
    return typeof exp === "number" ? exp - nowMs / 1000 : null;
  } catch {
    return null;
  }
}

/** A valid IANA zone name as the runtime knows it, or null. */
export function cleanTimezone(tz: string | null | undefined): string | null {
  if (!tz || tz.length > 64 || /^local$/i.test(tz)) return null;
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone: tz }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

/** devAuthUrl() for a given environment; pure so src/proxy.ts can use it too. */
export function devAuthUrlFrom(nodeEnv: string | undefined, raw: string | undefined): string | null {
  if (nodeEnv === "production" || !raw) return null;
  try {
    const u = new URL(raw);
    const loopback = u.hostname === "127.0.0.1" || u.hostname === "localhost" || u.hostname === "[::1]";
    return loopback && (u.protocol === "http:" || u.protocol === "https:") ? raw.replace(/\/$/, "") : null;
  } catch {
    return null;
  }
}
