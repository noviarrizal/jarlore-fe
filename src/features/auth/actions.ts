"use server";

import { redirect } from "next/navigation";
import { clearSession, devAuthUrl, setSession } from "@/lib/auth/session";

export type SignInState = { message: string } | null;

/**
 * Development sign-in: asks jarlore-be's local issuer (cmd/devauth) for a token
 * for one of its demo users. It only exists when JARLORE_DEV_AUTH_URL is set and
 * never in a production build.
 */
export async function signInDev(_prev: SignInState, form: FormData): Promise<SignInState> {
  const base = devAuthUrl();
  if (!base) return { message: "Development sign-in is turned off." };
  const user = form.get("user") === "other" ? "other" : "demo";
  let token: { access_token: string; expires_in: number };
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/token`, {
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
  await setSession(token.access_token, token.expires_in);
  redirect("/today");
}

export async function signOut() {
  await clearSession();
  redirect("/login");
}
