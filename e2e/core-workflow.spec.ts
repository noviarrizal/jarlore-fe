import { apiCall, expect, newUser, signIn, test, type TestUser } from "./fixtures";

type Batch = { id: string; code: string; bottles: { id: string; label: string; flavorName: string | null }[] };

/**
 * The acceptance journey: Log → Rate → Save as Recipe → Brew Again → Compare,
 * through the real UI, API and database. One brand-new user per run.
 */
test("F1 → F2 bottles → rate → save recipe → brew again → diff → compare", async ({ page, context, baseURL, user, consoleErrors }) => {
  test.slow();
  await signIn(context, baseURL!, user, "Europe/London");
  const toast = (re: RegExp) => expect(page.getByText(re).first()).toBeVisible();

  // Create an F1 batch from the kombucha template.
  await page.goto("/batches/new?type=kombucha");
  await page.getByLabel("Name").fill("Ginger kombucha");
  await page.getByLabel(/What are you changing/).fill("Four ginger forms in F2: which gives the best fizz?");
  await page.getByRole("button", { name: "Start batch" }).click();
  await page.waitForURL(/started=1/);
  const batchUrl = page.url().split("?")[0];
  const batchId = batchUrl.split("/").pop()!;
  const code = (await page.locator("h1 .code").first().textContent())!.trim();
  expect(code).toMatch(/^KB-\d{3}$/);

  // Reload: the batch persisted.
  await page.reload();
  await expect(page.locator("h1")).toContainText(code);

  // Log an F1 taste with pH and temperature.
  await page.getByRole("button", { name: `Log on ${code}` }).click();
  await page.getByLabel("pH", { exact: true }).fill("3.1");
  await page.getByLabel(/^Temp/).fill("23");
  await page.getByPlaceholder(/Still sweet/).fill("Tart and dry. Ready to bottle tomorrow.");
  await page.getByRole("button", { name: "Log taste" }).click();
  await toast(new RegExp(`Logged on ${code}`));

  // Split into four F2 bottles with different additions.
  await page.goto(`${batchUrl}/bottle`);
  const specs = [
    { flavour: "Ginger juice", adds: [["Ginger", "juice", "15", "ml"]] },
    { flavour: "Ginger puree", adds: [["Ginger", "puree", "30", "g"]] },
    { flavour: "Ginger chunks", adds: [["Ginger", "chunks", "15", "g"]] },
    { flavour: "Raspberry lime", adds: [["Raspberry", "whole", "40", "g"], ["Lime", "juice", "10", "ml"]] },
  ];
  for (let i = 0; i < specs.length; i++) {
    if (i > 0) await page.getByRole("button", { name: "Add bottle" }).click();
    const li = page.locator("form ol > li").nth(i);
    await li.getByLabel("Flavour").fill(specs[i].flavour);
    for (let j = 0; j < specs[i].adds.length; j++) {
      await li.getByRole("button", { name: "Add addition" }).click();
      const [n, f, a, u] = specs[i].adds[j];
      await li.getByLabel("Addition").nth(j).fill(n);
      await li.getByLabel("Form").nth(j).selectOption(f);
      await li.getByLabel("Amount").nth(j).fill(a);
      await li.getByLabel("Unit").nth(j).fill(u);
    }
    await li.getByLabel("Priming sugar").fill(i === 3 ? "2" : "4");
    await li.getByLabel("Headspace").fill("2");
  }
  await page.getByRole("button", { name: `Bottle 4 from ${code}` }).click();
  await page.waitForURL(/\/bottles$/);

  // Bottle-specific observations: burp all, pH on bottle A.
  await page.getByRole("button", { name: "Burp" }).click();
  await page.getByRole("button", { name: "Log burp" }).click();
  await toast(new RegExp(`Logged on ${code}`));
  await page.getByRole("button", { name: `Log on ${code}` }).click();
  await page.getByRole("button", { name: /^A Ginger juice/ }).click();
  await page.getByRole("radio", { name: "Measure" }).click();
  await page.getByLabel("pH", { exact: true }).fill("3.3");
  await page.getByRole("button", { name: "Log measurement" }).click();
  await toast(new RegExp(`Logged on ${code}`));

  // Finish and rate every bottle.
  const scores: Record<string, string> = { A: "5", B: "4", C: "3", D: "4" };
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "Finish & rate" }).first().click();
    const dialog = page.getByRole("dialog");
    const label = ((await dialog.getByRole("heading").textContent()) ?? "").trim().slice(-1);
    await dialog.getByRole("radiogroup", { name: "Overall" }).getByRole("radio", { name: scores[label] }).click();
    await dialog.getByRole("radiogroup", { name: "Fizz" }).getByRole("radio", { name: label === "A" ? "5" : "3" }).click();
    await dialog.getByLabel("How did it turn out?").fill(label === "A" ? "Sharp ginger, the best fizz of the four" : `Bottle ${label} notes`);
    await dialog.getByRole("button", { name: "Save rating" }).click();
    await toast(new RegExp(`Rated bottle ${label}`));
    await expect(dialog).toBeHidden();
  }

  // Mark bottle A as the best and save it as an F2 recipe.
  await page.getByRole("button", { name: "Mark as best" }).first().click();
  await toast(/Marked bottle A as the best/);
  await page.getByRole("button", { name: "Save as recipe" }).first().click();
  const save = page.getByRole("dialog");
  await save.getByLabel("Recipe name").fill("Ginger juice bottle");
  await save.getByLabel(/worth keeping/).fill("Juice gave the cleanest ginger and the most fizz");
  await save.getByRole("button", { name: "Save recipe" }).click();
  await page.waitForURL(/\/recipes\//);
  const recipeUrl = page.url();

  // Finish the F1 batch, then brew it again.
  await page.goto(batchUrl);
  await page.getByRole("button", { name: "Finish & rate" }).click();
  const fin = page.getByRole("dialog");
  await fin.getByRole("radiogroup", { name: "Overall" }).getByRole("radio", { name: "4" }).click();
  await fin.getByRole("button", { name: "Save rating" }).click();
  await toast(new RegExp(`Rated ${code}`));
  await page.getByRole("link", { name: "Brew again" }).click();
  await page.waitForURL(/brew-again/);
  await page.getByLabel(/What are you changing/).fill("Same base. Testing ginger puree in the bottle.");
  await page.getByRole("button", { name: "Start batch" }).click();
  await page.waitForURL(/started=1/);
  const batch2Url = page.url().split("?")[0];
  const code2 = (await page.locator("h1 .code").first().textContent())!.trim();

  // A new bottle from the F2 recipe with a different form and amount: live diff, next version.
  await page.goto(`${batch2Url}/bottle`);
  const li = page.locator("form ol > li").first();
  const option = await li.getByLabel("Start from").locator("option", { hasText: "Ginger juice bottle v1" }).getAttribute("value");
  await li.getByLabel("Start from").selectOption(option!);
  await li.getByLabel("Flavour").fill("Ginger puree");
  await li.getByLabel("Form").first().selectOption("puree");
  await li.getByLabel("Amount").first().fill("30");
  await li.getByLabel("Unit").first().fill("g");
  await li.getByLabel(/What are you changing/).fill("Puree for more body; does it keep the fizz?");
  await expect(page.getByText(/becomes v2 of the recipe/)).toBeVisible();
  await page.getByRole("button", { name: `Bottle 1 from ${code2}` }).click();
  await page.waitForURL(/\/bottles$/);

  await page.getByRole("button", { name: "Finish & rate" }).first().click();
  const fin2 = page.getByRole("dialog");
  await fin2.getByRole("radiogroup", { name: "Overall" }).getByRole("radio", { name: "4" }).click();
  await fin2.getByRole("radiogroup", { name: "Fizz" }).getByRole("radio", { name: "3" }).click();
  await fin2.getByLabel("How did it turn out?").fill("More body, softer fizz");
  await fin2.getByRole("button", { name: "Save rating" }).click();
  await toast(/Rated bottle A/);

  // Compare the two experiments.
  const first = await apiCall<Batch>(user, "GET", `/v1/batches/${batchId}`);
  const second = await apiCall<Batch>(user, "GET", `/v1/batches/${batch2Url.split("/").pop()}`);
  const bottleA = first.bottles.find((b) => b.label === "A")!;
  await page.goto(`/compare?items=bottle:${bottleA.id},bottle:${second.bottles[0].id}`);
  const compare = page.locator("main");
  for (const text of ["juice", "puree", "15 ml", "30 g"]) await expect(compare).toContainText(text);

  // History is unchanged: both recipe versions exist, the first batch's bottle A is as it was.
  await page.goto(recipeUrl);
  await expect(page.locator("main")).toContainText("v1");
  await expect(page.locator("main")).toContainText("v2");
  await page.goto(`${batchUrl}/bottles`);
  await expect(page.locator("main")).toContainText("Ginger juice");
  await expect(page.locator("main")).toContainText("15 ml");

  // Another account sees none of it.
  const other: TestUser = await newUser();
  const otherContext = await context.browser()!.newContext({ baseURL: baseURL!, viewport: { width: 390, height: 844 } });
  await signIn(otherContext, baseURL!, other);
  const otherPage = await otherContext.newPage();
  await otherPage.goto(batchUrl);
  await expect(otherPage.getByText(/isn.t here/)).toBeVisible();
  await otherContext.close();

  expect(consoleErrors).toEqual([]);
});
