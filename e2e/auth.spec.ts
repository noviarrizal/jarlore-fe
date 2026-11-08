import { expect, signIn, test } from "./fixtures";

test.describe("signed-out visitors", () => {
  for (const path of ["/today", "/batches", "/recipes", "/compare", "/me"]) {
    test(`${path} sends them to sign in`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    });
  }

  test("sign-in remembers where they were going", async ({ page }) => {
    await page.goto("/recipes?scope=bottle");
    const url = new URL(page.url());
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("next")).toBe("/recipes?scope=bottle");
  });
});

test.describe("tokens the API refuses", () => {
  for (const [name, token] of [
    ["malformed", "not-a-jwt"],
    ["unsigned", "eyJhbGciOiJub25lIn0.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTQwMDAtODAwMC0wMDAwMDAwMDAwMDEifQ."],
    ["signed by someone else", "eyJhbGciOiJFZERTQSIsImtpZCI6IngifQ.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTQwMDAtODAwMC0wMDAwMDAwMDAwMDEifQ.c2ln"],
  ] as const) {
    test(`a ${name} token lands on sign-in as an expired session`, async ({ page, context, baseURL }) => {
      await context.addCookies([
        { name: "jarlore_session", value: token, url: baseURL! },
        { name: "jarlore_dev_session", value: "1", url: baseURL! },
      ]);
      await page.goto("/today");
      await expect(page).toHaveURL(/\/login\?.*expired=1/);
      await expect(page.getByText("Your session ended. Sign in again to carry on.")).toBeVisible();
    });
  }
});

test("development sign-in returns to the page they asked for", async ({ page }) => {
  await page.goto("/login?next=/recipes");
  await page.getByRole("radio", { name: /Second brewer/ }).check();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/recipes$/);
});

test("sign-in never redirects off-site", async ({ page }) => {
  await page.goto("/login?next=//evil.example/");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/today$/);
});

test("signing out ends the session", async ({ page, context, baseURL, user }) => {
  await signIn(context, baseURL!, user);
  await page.goto("/me");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  const names = (await context.cookies()).map((c) => c.name);
  expect(names).not.toContain("jarlore_session");
  await page.goto("/today");
  await expect(page).toHaveURL(/\/login/);
});

test("the access token is never readable by page scripts", async ({ page, context, baseURL, user }) => {
  await signIn(context, baseURL!, user);
  await page.goto("/today");
  expect(await page.evaluate(() => document.cookie)).not.toContain("jarlore_session");
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }))).not.toContain(user.token);
  const html = await page.content();
  expect(html).not.toContain(user.token);
});
