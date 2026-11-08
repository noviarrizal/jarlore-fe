"use server";

import { redirect } from "next/navigation";
import { neonAuthCalls } from "@/lib/auth/neon";
import { clearSession, devAuthUrl, rememberTimezone, setDevSession } from "@/lib/auth/session";

export type SignInState = { message: string } | null;

export type EmailCodeState =
  | { step: "email"; email?: string; message?: string }
  | { step: "code"; email: string; message?: string; sent?: boolean };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Only same-site paths, so ?next= can't send someone to another site. */
function safeNext(raw: FormDataEntryValue | null): string {
  const next = typeof raw === "string" ? raw : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/today";
}

/**
 * Email sign-in with a one-time code (Neon Auth email OTP). Step 1 sends the code;
 * step 2 checks it. Neon Auth sets its session cookies in this Server Action, and
 * src/proxy.ts mints the API token on the next page request.
 */
export async function emailCodeSignIn(prev: EmailCodeState, form: FormData): Promise<EmailCodeState> {
  const auth = neonAuthCalls();
  if (!auth) return { step: "email", message: "Email sign-in isn't set up on this server." };
  const intent = form.get("intent");
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (intent === "change") return { step: "email", email };

  if (intent === "send" || intent === "resend" || prev.step === "email") {
    if (!EMAIL.test(email) || email.length > 254) return { step: "email", email, message: "Enter the email address you use for Jarlore." };
    const { error } = await auth.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
    if (error) {
      return {
        step: intent === "resend" ? "code" : "email",
        email,
        message: error.status === 429 ? "Too many codes requested. Wait a minute, then try again." : "We couldn't send a code just now. Try again in a moment.",
      };
    }
    return { step: "code", email, sent: true };
  }

  const otp = String(form.get("code") ?? "").replace(/\s+/g, "");
  if (!/^\d{4,10}$/.test(otp)) return { step: "code", email, message: "Enter the code from the email." };
  const { error } = await auth.signIn.emailOtp({ email, otp });
  if (error) {
    const text = `${error.message ?? ""} ${(error as { code?: string }).code ?? ""}`.toLowerCase();
    return {
      step: "code",
      email,
      message:
        error.status === 429 || text.includes("too_many") || text.includes("too many")
          ? "Too many attempts. Ask for a new code."
          : text.includes("expire")
            ? "That code has expired. Ask for a new one."
            : "That code isn't right. Check the email and try again.",
    };
  }
  // A new account starts in the browser's time zone; the old API token belongs to
  // whoever was signed in before.
  await clearSession();
  await rememberTimezone(String(form.get("tz") ?? ""));
  redirect(safeNext(form.get("next")));
}

/**
 * Development sign-in: asks jarlore-be's local issuer (cmd/devauth) for a token
 * for one of its demo users. Only on loopback, only outside production builds.
 */
export async function signInDev(_prev: SignInState, form: FormData): Promise<SignInState> {
  const base = devAuthUrl();
  if (!base) return { message: "Development sign-in is turned off." };
  const user = form.get("user") === "other" ? "other" : "demo";
  let token: { access_token: string; expires_in: number };
  try {
    const res = await fetch(`${base}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user }),
      cache: "no-store",
    });
    if (!res.ok) return { message: "The development sign-in server refused the request." };
    token = await res.json();
  } catch {
    return { message: "Couldn't reach the development sign-in server. Start it with `go run ./cmd/devauth` in jarlore-be." };
  }
  await setDevSession(token.access_token, token.expires_in);
  await rememberTimezone(String(form.get("tz") ?? ""));
  redirect(safeNext(form.get("next")));
}

/** Ends the Neon Auth session (server side) and drops the API token. */
export async function signOut() {
  const auth = neonAuthCalls();
  if (auth) await auth.signOut().catch(() => undefined);
  await clearSession();
  redirect("/login");
}
