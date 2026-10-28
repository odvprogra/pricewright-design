/**
 * The quote builder beyond the usability test's tasks: what a participant could stumble on while
 * doing them.
 */
import { type Page, expect, test } from "@playwright/test";

async function newDraft(page: Page): Promise<void> {
  await page.goto("./?reset");
  await page.getByLabel("Email").fill("taylor@northfield.example");
  await page.getByLabel("Password").fill("any password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.goto("./#/customers?q=stonegate");
  await page.getByRole("link", { name: "Stonegate Storage Centers LLC", exact: true }).click();
  await page.getByRole("button", { name: "New quote" }).click();
}

test("every product option can be seen, even on an empty draft", async ({ page }) => {
  await newDraft(page);
  await page.getByRole("combobox", { name: "Add a product" }).fill("glove");
  const options = page.getByRole("option");
  await expect(options).toHaveCount(8);
  // toBeVisible() ignores clipping by a scroll container: ask what is drawn at each option.
  const drawn = await options.evaluateAll((items) =>
    items.map((item) => {
      const box = item.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + 8, box.top + box.height / 2);
      return hit !== null && item.contains(hit);
    }),
  );
  expect(drawn).toEqual(Array.from({ length: 8 }, () => true));
});

test("a draft is cancelled with a reason, after a confirmation that names it", async ({ page }) => {
  await newDraft(page);
  const number = (await page.locator(".quote-head .eyebrow").textContent()) ?? "";
  await page.getByRole("button", { name: "Cancel draft" }).click();
  const dialog = page.getByRole("dialog", { name: `Cancel ${number} for good?` });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel quote" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Say why the quote is cancelled");
  await dialog.getByLabel("Reason (required)").fill("The customer bought elsewhere.");
  await dialog.getByRole("button", { name: "Cancel quote" }).click();

  await expect(page.locator(".notice", { hasText: `${number} was cancelled.` })).toBeVisible();
  await expect(page.locator("#live")).toContainText(`${number} was cancelled.`);
  await expect(page.getByText("Cancelled").first()).toBeVisible();
});
