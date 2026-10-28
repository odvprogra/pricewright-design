/**
 * What a screen reader is told, from NVDA pass 1 (docs/ux/accessibility/nvda-pass-1.md): every
 * message goes through the page's one live region, #live, which no render replaces. NVDA read none
 * of the messages drawn inside a re-render (role="status" inserted with its text).
 */
import { type Page, expect, test } from "@playwright/test";

test.skip(({ isMobile }) => isMobile, "the messages are the same on a phone");

const live = (page: Page) => page.locator("#live");

async function signIn(page: Page, email = "taylor@northfield.example"): Promise<void> {
  await page.goto("./?reset");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("any password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("h1")).toBeFocused();
}

async function newDraft(page: Page): Promise<void> {
  await signIn(page);
  await page.goto("./#/customers?q=stonegate");
  await page.getByRole("link", { name: "Stonegate Storage Centers LLC", exact: true }).click();
  await page.getByRole("button", { name: "New quote" }).click();
}

async function addLine(page: Page, sku: string, quantity: string): Promise<void> {
  const product = page.getByRole("combobox", { name: "Add a product" });
  await product.fill(sku);
  await product.press("Enter");
  await page.getByLabel("Quantity", { exact: true }).fill(quantity);
  await page.getByLabel("Quantity", { exact: true }).press("Enter");
  await expect(product).toBeFocused();
}

test("no live region is drawn inside the page: #live is the only one", async ({ page }) => {
  await newDraft(page);
  await addLine(page, "FST-0063", "60");
  await page.getByRole("button", { name: "Remove FST-0063" }).click();
  await page.getByRole("button", { name: "Undo" }).click();
  await page.getByRole("button", { name: "Submit for approval" }).click();
  await expect(page.locator(".notice", { hasText: "Submitted." })).toBeVisible();

  const regions = page.locator("[aria-live], [role='status'], [role='log'], [role='marquee']");
  await expect(regions).toHaveCount(1);
  await expect(regions).toHaveAttribute("id", "live");
  await expect(page.locator("#app #live")).toHaveCount(0);
});

test("the customer search announces how many customers match", async ({ page }) => {
  await signIn(page);
  await page.goto("./#/customers");
  await page.getByLabel("Search").pressSequentially("stonegate");
  await expect(live(page)).toHaveText("4 customers");
});

test("removing a line says what went and where Undo is, with the new total", async ({ page }) => {
  await newDraft(page);
  // Each line's total is read before the next action: messages within 100 ms are read together.
  await addLine(page, "FST-0063", "60");
  await expect(live(page)).toHaveText("Total 2,726.99 USD");
  await addLine(page, "OFP-0036", "12");
  await expect(live(page)).toHaveText("Total 3,086.67 USD");

  await page.getByRole("button", { name: "Remove OFP-0036" }).click();
  await expect(live(page)).toHaveText(
    "OFP-0036 removed. Undo is after the product search. Total 2,726.99 USD",
  );
});

test("opening a line's breakdown does not announce an unchanged total", async ({ page }) => {
  await newDraft(page);
  await addLine(page, "FST-0063", "60");
  await expect(live(page)).toHaveText("Total 2,726.99 USD");
  await page.evaluate(() => {
    const region = document.getElementById("live");
    if (region !== null) region.textContent = "";
  });

  await page.getByRole("button", { name: "Why this price" }).click();
  await expect(page.getByRole("heading", { name: /^Why FST-0063 costs/ })).toBeVisible();
  await page.waitForTimeout(300);
  await expect(live(page)).toHaveText("");
});

test("submitting announces the outcome after the page redraws", async ({ page }) => {
  await newDraft(page);
  await addLine(page, "FST-0063", "60");
  await expect(live(page)).toHaveText("Total 2,726.99 USD");
  await page.getByRole("button", { name: "Submit for approval" }).click();

  await expect(page.locator("h1")).toBeFocused();
  await expect(live(page)).toHaveText(
    "Submitted. A manager will decide on it; you'll get an email.",
  );
});

test("the product search says how many match once typing pauses", async ({ page }) => {
  await newDraft(page);
  await page.getByRole("combobox", { name: "Add a product" }).pressSequentially("fst-00");
  await expect(live(page)).toHaveText(
    "8 products match. FST-0063 Zinc-Plated Sleeve Anchor, 1/2 in x 3-3/4 in, Box of 25, 1 of 8, is highlighted.",
  );
});

test("each request in the inbox reads its amount and its number apart", async ({ page }) => {
  await signIn(page, "morgan@northfield.example");
  const link = page.getByRole("link", { name: /Stonegate Storage Centers LLC/ });
  await expect(link).toHaveAccessibleName(/1,722\.55 USD\s*,\s*NF-2026-000132/);
});
