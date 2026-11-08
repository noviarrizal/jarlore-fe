import { createNeonAuth } from "@neon/auth/next/server";

/**
 * Neon Auth (Managed Better Auth) is the identity provider. It keeps the user's
 * session in its own httpOnly cookies (`__Secure-neon-auth.*`); jarlore-be never
 * sees those. What jarlore-be needs is the short-lived EdDSA JWT that Neon Auth
 * mints for the session (GET {NEON_AUTH_BASE_URL}/token), which src/proxy.ts keeps
 * fresh in the httpOnly `jarlore_session` cookie.
 *
 * Both variables are server-only (no NEXT_PUBLIC_ prefix): NEON_AUTH_BASE_URL is
 * the branch's Auth URL from the Neon console, NEON_AUTH_COOKIE_SECRET (32+
 * characters) signs the SDK's session cache cookie.
 */
type NeonAuth = ReturnType<typeof createNeonAuth>;

let instance: NeonAuth | null | undefined;

export function neonAuthBaseUrl(): string | null {
  const url = process.env.NEON_AUTH_BASE_URL?.trim();
  return url ? url.replace(/\/$/, "") : null;
}

/** The Neon Auth server SDK, or null when this deployment has no Neon Auth configured. */
export function neonAuth(): NeonAuth | null {
  if (instance !== undefined) return instance;
  const baseUrl = neonAuthBaseUrl();
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  instance = baseUrl && secret ? createNeonAuth({ baseUrl, cookies: { secret, sameSite: "lax" } }) : null;
  return instance;
}

/** Name of Neon Auth's session cookie (fixed by the SDK, `__Secure-` even on localhost). */
export const NEON_SESSION_COOKIE = "__Secure-neon-auth.session_token";

/**
 * Mints a JWT for the Neon Auth session carried by `cookieHeader`. Returns null
 * when the session is missing, expired or revoked (Neon answers 401).
 */
export async function mintNeonToken(cookieHeader: string, origin: string): Promise<string | null> {
  const base = neonAuthBaseUrl();
  if (!base) return null;
  const res = await fetch(`${base}/token`, {
    method: "GET",
    headers: { Cookie: cookieHeader, Origin: origin, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) throw new Error(`Neon Auth token request failed (${res.status})`);
  const body = (await res.json().catch(() => null)) as { token?: unknown } | null;
  return typeof body?.token === "string" && body.token.split(".").length === 3 ? body.token : null;
}

type AuthResult = Promise<{ data: unknown; error: { message?: string; status: number; code?: string } | null }>;

/**
 * The calls Jarlore makes, typed by hand: @neon/auth 0.8.2's types omit the
 * email-OTP plugin although its runtime exposes it (API_ENDPOINTS in
 * dist/server.js: "email-otp/send-verification-otp", "sign-in/email-otp").
 */
export interface NeonAuthCalls {
  emailOtp: { sendVerificationOtp(body: { email: string; type: "sign-in" }): AuthResult };
  signIn: { emailOtp(body: { email: string; otp: string }): AuthResult };
  signOut(): AuthResult;
}

export function neonAuthCalls(): NeonAuthCalls | null {
  return neonAuth() as unknown as NeonAuthCalls | null;
}
