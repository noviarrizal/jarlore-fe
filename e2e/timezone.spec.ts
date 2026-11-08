import { apiCall, expect, signIn, test } from "./fixtures";

type Me = { timezone: string };
type Batch = { id: string; code: string };
type Log = { id: string; occurredAt: string };

const timeIn = (iso: string, tz: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));

async function batchWithLog(user: Parameters<typeof apiCall>[0], note: string) {
  const batch = await apiCall<Batch>(user, "POST", "/v1/batches", {
    fermentationTypeId: "kombucha",
    name: "Time zone check",
    volumeMl: 2000,
    ingredients: [{ name: "Cane sugar", role: "sugar", amount: 100, unit: "g" }],
    params: {},
  });
  const logs = await apiCall<{ data: Log[] }>(user, "POST", `/v1/batches/${batch.id}/logs`, { kind: "note", note });
  return { batch, log: logs.data[0] };
}

for (const zone of ["Asia/Jakarta", "Europe/London", "America/New_York"]) {
  test(`a brewer in ${zone} sees their own local time`, async ({ page, context, baseURL, user }) => {
    await signIn(context, baseURL!, user, zone);
    // The first page creates the profile in the browser's zone.
    await page.goto("/today");
    expect((await apiCall<Me>(user, "GET", "/v1/me")).timezone).toBe(zone);

    const { batch, log } = await batchWithLog(user, `Noted in ${zone}`);
    await page.goto(`/batches/${batch.id}`);
    const timeline = page.getByRole("listitem").filter({ hasText: `Noted in ${zone}` }).last();
    await expect(timeline).toContainText(timeIn(log.occurredAt, zone));
    if (zone !== "Europe/London") await expect(timeline).not.toContainText(timeIn(log.occurredAt, "Europe/London"));
  });
}

test("changing the time zone changes how times read, never when they happened", async ({ page, context, baseURL, user }) => {
  await signIn(context, baseURL!, user, "Asia/Jakarta");
  await page.goto("/today");
  const { batch, log } = await batchWithLog(user, "Before the move");

  await page.goto("/me");
  await page.getByLabel("Time zone").selectOption("America/New_York");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toContainText("Saved");
  expect((await apiCall<Me>(user, "GET", "/v1/me")).timezone).toBe("America/New_York");

  await page.goto(`/batches/${batch.id}`);
  await expect(page.getByRole("listitem").filter({ hasText: "Before the move" }).last()).toContainText(timeIn(log.occurredAt, "America/New_York"));
  const after = await apiCall<{ data: Log[] }>(user, "GET", `/v1/batches/${batch.id}/logs`);
  expect(after.data.find((l) => l.id === log.id)?.occurredAt).toBe(log.occurredAt);
});

test("an invalid zone hint falls back to UTC", async ({ page, context, baseURL, user }) => {
  await signIn(context, baseURL!, user, "Mars/Olympus_Mons");
  await page.goto("/today");
  expect((await apiCall<Me>(user, "GET", "/v1/me")).timezone).toBe("UTC");
});
