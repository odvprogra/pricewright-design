/**
 * The usability test's five tasks (docs/ux/usability-test-1/plan.md), run on the prototype as a
 * participant would, with axe on every screen they pass through. Tasks 1, 2, 3 and 5 on a desktop,
 * task 4 on a phone.
 */
import { AxeBuilder } from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

const TAYLOR = "taylor@northfield.example";
const MORGAN = "morgan@northfield.example";

async function noAxeViolations(page: Page, screen: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.help}`),
    screen,
  ).toEqual([]);
}

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto("./?reset");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("any password");
  await noAxeViolations(page, "sign in");
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function noHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test.describe("as a sales rep, on a desktop", () => {
  test.skip(({ isMobile }) => isMobile, "tasks 1, 2, 3 and 5 run on a computer");

  test("task 1: find Stonegate's payment terms", async ({ page }) => {
    await signIn(page, TAYLOR);
    await page.getByRole("link", { name: "Customers" }).click();
    await page.getByLabel("Search").fill("stonegate");
    await expect(page.getByText("4 customers")).toBeVisible();
    await noAxeViolations(page, "customers");
    await page.getByRole("link", { name: "Stonegate Storage Centers LLC", exact: true }).click();

    await expect(page.getByText("Net 60")).toBeVisible();
    await noAxeViolations(page, "customer");
  });

  test("tasks 2 and 3: build the 5-line quote with the keyboard, explain a price, submit it", async ({
    page,
  }) => {
    await signIn(page, TAYLOR);
    await page.goto("./#/customers?q=stonegate");
    await page.getByRole("link", { name: "Stonegate Storage Centers LLC", exact: true }).click();
    await page.getByRole("button", { name: "New quote" }).click();
    await expect(page.getByText("Type a SKU or product name to add the first line.")).toBeVisible();
    await noAxeViolations(page, "empty draft");

    const lines: [string, string][] = [
      ["FST-0063", "60"],
      ["File Folders, Letter, Straight", "12"],
      ["SAF-0936", "48"],
      ["Trash Can Liners, 55-60", "20"],
      ["SAF-0829", "100"],
    ];
    for (const [search, quantity] of lines) {
      const product = page.getByRole("combobox", { name: "Add a product" });
      await product.fill(search);
      await expect(page.getByRole("listbox")).toBeVisible();
      await product.press("Enter");
      await expect(page.getByLabel("Quantity", { exact: true })).toBeFocused();
      await page.getByLabel("Quantity", { exact: true }).fill(quantity);
      await page.getByLabel("Quantity", { exact: true }).press("Enter");
      await expect(page.getByRole("combobox", { name: "Add a product" })).toBeFocused();
    }

    // The engine's totals for this quote (tests/fixtures/engine-prices.json): 5,186.19 at 16.41%.
    await expect(page.locator(".totals .grand dd")).toHaveText("5,186.19 USD");
    await expect(page.locator("#approval-check")).toContainText(
      "16.4% off list is above your 15% threshold",
    );
    await noAxeViolations(page, "builder");

    await page.getByRole("button", { name: "Why this price" }).first().click();
    const waterfall = page.getByRole("list", { name: "How FST-0063 is priced" });
    await expect(waterfall).toContainText("Fastener volume pricing");
    await expect(waterfall).toContainText("Gold account discount");
    await expect(waterfall).toContainText("42.3775");

    await page.getByRole("button", { name: "Submit for approval" }).click();
    await expect(page.getByText("Pending approval").first()).toBeVisible();
    await expect(page.locator(".notice", { hasText: "A manager will decide on it" })).toBeVisible();
    await expect(page.locator("#live")).toContainText("A manager will decide on it");
    await noAxeViolations(page, "pending quote");
  });

  test("task 5: send the quote Morgan approved, and say who received it", async ({ page }) => {
    await signIn(page, TAYLOR);
    await page.goto("./#/customers?q=stonegate");
    await page.getByRole("link", { name: "Stonegate Storage Centers LLC", exact: true }).click();
    await page.getByRole("button", { name: "New quote" }).click();
    const product = page.getByRole("combobox", { name: "Add a product" });
    await product.fill("FST-0063");
    await product.press("Enter");
    await page.getByLabel("Quantity", { exact: true }).fill("60");
    await page.getByLabel("Quantity", { exact: true }).press("Enter");
    await page.getByRole("button", { name: "Submit for approval" }).click();
    const number = (await page.locator(".quote-head .eyebrow").textContent()) ?? "";

    await page.goto("./#/moderator/approve-latest");
    await expect(page.getByText(`Morgan Reyes approved ${number}.`)).toBeVisible();
    await page.getByRole("link", { name: "Continue" }).click();
    await page.getByRole("link", { name: number }).click();
    await expect(page.getByText("Approved").first()).toBeVisible();
    await page.getByRole("button", { name: "Send to customer" }).click();
    const dialog = page.getByRole("dialog", { name: "Send to customer?" });
    await expect(dialog).toContainText("purchasing@stonegate-storage-centers-llc.example");
    await noAxeViolations(page, "send dialog");
    await dialog.getByRole("button", { name: "Send to customer" }).click();

    const sent =
      "Sent to purchasing@stonegate-storage-centers-llc.example. Replies go to Taylor Brooks.";
    await expect(page.locator(".notice", { hasText: sent })).toBeVisible();
    await expect(page.locator("#live")).toContainText(sent);
    await noAxeViolations(page, "sent quote");
  });
});

test.describe("as the sales manager, on a phone", () => {
  test.skip(({ isMobile }) => !isMobile, "task 4 runs on a phone");

  test("task 4: approve Stonegate's quote and reject Kestrel Bay's NF-2026-000140 with a comment", async ({
    page,
  }) => {
    await signIn(page, MORGAN);
    await expect(page.getByRole("heading", { name: "Approvals" })).toBeVisible();
    await expect(page.getByText("8 waiting")).toBeVisible();
    await noHorizontalScroll(page);
    await noAxeViolations(page, "inbox");

    await page.getByRole("link", { name: /Stonegate Storage Centers LLC/ }).click();
    await expect(
      page.locator(".inbox-detail").getByText("17.3% off list, above the 15% threshold"),
    ).toBeVisible();
    await noHorizontalScroll(page);
    await noAxeViolations(page, "request");
    await page.getByRole("button", { name: "Approve" }).click();
    await expect(page.locator(".notice", { hasText: "Approved NF-2026-000132" })).toBeVisible();
    await expect(page.locator("#live")).toContainText("Approved NF-2026-000132");

    await page.goto("./#/approvals");
    await page.getByRole("link", { name: /NF-2026-000140/ }).click();
    await page.getByRole("button", { name: "Reject" }).click();
    await expect(page.getByRole("alert")).toContainText("Say what should change");
    await page.getByLabel(/Comment/).fill("Bring it within 15% off list.");
    await page.getByRole("button", { name: "Reject" }).click();
    await expect(page.locator(".notice", { hasText: "Rejected NF-2026-000140" })).toBeVisible();
    await expect(page.locator("#live")).toContainText("Rejected NF-2026-000140");
    await expect(page.getByText("6 waiting")).toBeVisible();
  });
});
