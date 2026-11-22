import { expect, test } from "./support";

/**
 * Design studios and made-to-order ranges: each must turn a customer's choices into
 * a manufacturable spec and hand it to the quote form intact.
 */
test.describe("sign studio", () => {
  test("rules block bad text, regional scripts are accepted, and the design reaches the quote form", async ({ page }) => {
    await page.goto("/signage/design?type=villa-nameplate", { waitUntil: "networkidle" });
    const lines = page.locator('input[maxlength="60"]');
    await lines.nth(0).fill("Sharma 🏠 Residence");
    await expect(page.getByText(/We can't letter “🏠”/)).toBeVisible();
    await expect(page.getByRole("link", { name: /request a quot/i })).toHaveCount(0);

    await lines.nth(0).fill("Sharma Residence");
    await lines.nth(1).fill("சர்மா இல்லம்");
    await expect(page.getByText(/native Tamil reader checks/)).toBeVisible();

    await page.getByRole("link", { name: /request a quot/i }).first().click();
    await expect(page).toHaveURL(/\/quote\?/);
    await expect(page.getByLabel("Quantity", { exact: false }).first()).toHaveValue(/\d+/);
    await expect(page.locator("main")).toContainText("Sharma Residence / சர்மா இல்லம்");
  });

  test("a shared design link reopens the same design", async ({ page }) => {
    await page.goto("/signage/design?type=floor-directory&t=Floor%209&t=901%20%E2%86%92", { waitUntil: "networkidle" });
    const lines = page.locator('input[maxlength="60"]');
    await expect(lines.nth(0)).toHaveValue("Floor 9");
    await expect(lines.nth(1)).toHaveValue("901 →");
    await expect(page.getByText("This design can be made as specified.")).toBeVisible();
  });
});

test.describe("planner designer", () => {
  test("tight layouts warn, empty titles block, and the layout reaches the quote form", async ({ page }) => {
    await page.goto("/planning", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Weekly planner/ }).click();
    await page.getByRole("button", { name: "3 × 2 ft" }).click();
    const rows = page.locator("fieldset").filter({ has: page.locator("legend", { hasText: /^Rows/ }) });
    for (let i = 0; i < 8; i++) await rows.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText(/too tight for handwriting/)).toBeVisible();

    await page.getByLabel("Header title").fill("");
    await expect(page.getByText("Add a title for the header.")).toBeVisible();
    await expect(page.getByRole("button", { name: /Fix the issues/ })).toBeDisabled();

    await page.getByLabel("Header title").fill("Studio rota");
    await page.getByRole("button", { name: "6 × 4 ft" }).click();
    await page.getByRole("link", { name: "Request a quote" }).click();
    await expect(page).toHaveURL(/\/quote\?/);
    await expect(page.locator("main")).toContainText("Title: Studio rota");
  });
});

test.describe("made-to-order and premium", () => {
  test("fabric board: three colours max, and the choice reaches the quote form", async ({ page }) => {
    await page.goto("/materials/fabric", { waitUntil: "networkidle" });
    for (const colour of ["Blue", "Maroon", "Grey"]) await page.getByRole("button", { name: colour, exact: true }).click();
    await expect(page.getByText("Colour (up to 3, shown side by side): Green + Blue + Maroon")).toBeVisible();
    await page.getByRole("link", { name: "Request a quote" }).click();
    await expect(page.locator("#quote-colour")).toHaveValue("Green + Blue + Maroon");
  });

  test("illuminated sign brief needs every answer, then opens a prefilled consultation", async ({ page }) => {
    await page.goto("/premium", { waitUntil: "networkidle" });
    const brief = page.getByRole("form", { name: "Illuminated sign brief" });
    await expect(brief.getByRole("button", { name: /Answer each question/ })).toBeDisabled();
    const pick = async (label: string, option: string) => {
      await brief.getByLabel(label).click();
      await page.getByRole("option", { name: option, exact: true }).click();
    };
    await pick("Style", "Lit letters");
    await pick("Where", "Outdoor");
    await brief.getByLabel("Approximate width (cm)").fill("240");
    await pick("Power point nearby?", "Yes");
    await brief.getByLabel("Site city").fill("Gurugram");
    await brief.getByRole("link", { name: "Request a consultation" }).click();
    await expect(page.locator("#quote-dimensions")).toHaveValue("240 cm wide");
    await expect(page.locator("main")).toContainText("Needs site survey");
  });

  test("education kit scales timetables per classroom and links them into the planner", async ({ page }) => {
    await page.goto("/kits/education", { waitUntil: "networkidle" });
    await page.locator("#kit-units").fill("6");
    const designBoard = page.getByRole("link", { name: "Design board" });
    await expect(designBoard).toHaveAttribute("href", /t=timetable.*q=6/);
    await designBoard.click();
    await expect(page.getByLabel("Quantity")).toHaveValue("6");
    await expect(page.getByLabel("Header title")).toHaveValue("Class timetable");
  });

  test("OEM enquiry opens the quote form with the OEM type selected", async ({ page }) => {
    await page.goto("/oem", { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /Send an OEM enquiry/ }).click();
    await expect(page).toHaveURL(/\/quote\?/);
    await expect(page.locator("main")).toContainText("OEM / Private Label");
    await expect(page.getByLabel(/requirements|notes/i).first()).toHaveValue(/Expected yearly volume/);
  });
});
