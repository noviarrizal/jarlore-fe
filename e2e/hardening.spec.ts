import { apiCall, expect, signIn, test } from "./fixtures";

test("security headers are sent", async ({ page }) => {
  const res = await page.goto("/login");
  const h = res!.headers();
  expect(h["content-security-policy"]).toContain("default-src 'self'");
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["content-security-policy"]).toContain("object-src 'none'");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["permissions-policy"]).toContain("camera=()");
  expect(h["x-powered-by"]).toBeUndefined();
});

test("pages render under the CSP without violations, on phone, tablet and desktop", async ({ page, context, baseURL, user, consoleErrors }) => {
  await signIn(context, baseURL!, user, "Europe/London");
  const batch = await apiCall<{ id: string }>(user, "POST", "/v1/batches", {
    fermentationTypeId: "kombucha",
    name: "A batch with a fairly long name to test wrapping on small screens",
    volumeMl: 4200,
    ingredients: [{ name: "Cane sugar", role: "sugar", amount: 228, unit: "g" }],
    params: {},
  });
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/today", "/batches", `/batches/${batch.id}`, "/recipes", "/me", "/"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} at ${width}px overflows`).toBeLessThanOrEqual(0);
    }
  }
  expect(consoleErrors.filter((e) => /Content Security Policy|Refused to/.test(e))).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("a missing batch shows not-found, not an error", async ({ page, context, baseURL, user }) => {
  await signIn(context, baseURL!, user);
  await page.goto("/batches/00000000-0000-4000-8000-00000000abcd");
  await expect(page.getByText(/isn.t here/)).toBeVisible();
});

test("comparing someone else's bottles is refused without leaking anything", async ({ page, context, baseURL, user }) => {
  await signIn(context, baseURL!, user);
  await page.goto("/compare?items=bottle:00000000-0000-4000-8000-00000000abcd,bottle:00000000-0000-4000-8000-00000000abce");
  await expect(page.getByText("Couldn't compare these")).toBeVisible();
});
