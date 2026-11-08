import { randomUUID } from "node:crypto";
import { test as base, expect, type BrowserContext, type Page } from "@playwright/test";

/**
 * Test-only helpers. Every test signs in as a brand-new user (random UUID) minted
 * by jarlore-be's local issuer (cmd/devauth, loopback only), so tests never share
 * data and can run again on the same database.
 */
export const API_URL = `http://127.0.0.1:${process.env.E2E_API_PORT ?? "18080"}`;
export const DEVAUTH_URL = "http://127.0.0.1:9999";

export type TestUser = { id: string; email: string; token: string };

export async function newUser(): Promise<TestUser> {
  const id = randomUUID();
  const email = `e2e-${id.slice(0, 8)}@jarlore.test`;
  const res = await fetch(`${DEVAUTH_URL}/token`, { method: "POST", body: JSON.stringify({ sub: id, email }) });
  if (!res.ok) throw new Error(`devauth refused a token: ${res.status}`);
  const { access_token } = (await res.json()) as { access_token: string };
  return { id, email, token: access_token };
}

/** Puts the user's session in the browser exactly as development sign-in does. */
export async function signIn(context: BrowserContext, baseURL: string, user: TestUser, timezone?: string) {
  const cookie = (name: string, value: string) => ({ name, value, url: baseURL, httpOnly: true, sameSite: "Lax" as const });
  await context.addCookies([
    cookie("jarlore_session", user.token),
    cookie("jarlore_dev_session", "1"),
    ...(timezone ? [cookie("jarlore_tz", timezone)] : []),
  ]);
}

/** Direct API call for test setup and assertions (the app never does this from the browser). */
export async function apiCall<T>(user: TestUser, method: string, path: string, body?: unknown, timezone?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${user.token}`,
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(method !== "GET" ? { "Idempotency-Key": randomUUID() } : {}),
      ...(timezone ? { "Jarlore-Timezone": timezone } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

/** Collects console errors and page crashes; tests assert the list is empty. */
export function watchConsole(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Download the React DevTools/.test(m.text())) errors.push(`console: ${m.text().slice(0, 300)}`);
  });
  return errors;
}

export const test = base.extend<{ user: TestUser; consoleErrors: string[] }>({
  // The fixture callback is named `provide` (not Playwright's usual `use`) so the
  // React hooks lint rule doesn't mistake it for React's use().
  user: async ({}, provide) => provide(await newUser()),
  consoleErrors: async ({ page }, provide) => provide(watchConsole(page)),
});

export { expect };
