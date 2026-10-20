/**
 * Keyboard-only checks from the first keyboard pass (docs/ux/accessibility/keyboard-pass-1.md):
 * where the focus goes after each action, driven by key presses only once the page is set up.
 */
import { type Page, expect, test } from "@playwright/test";

test.skip(({ isMobile }) => isMobile, "keyboard journeys run on a computer");

async function signIn(page: Page, email = "taylor@northfield.example"): Promise<void> {
  await page.goto("./?reset");
  await page.keyboard.type(email);
  await page.keyboard.press("Tab");
  await page.keyboard.type("any password");
  await page.keyboard.press("Enter");
  await expect(page.locator("h1")).toBeFocused();
}

/** Press Tab (or Shift+Tab) until the element is focused; fail after `max` presses. */
async function tabTo(page: Page, name: string, back = false, max = 80): Promise<number> {
  for (let presses = 1; presses <= max; presses++) {
    await page.keyboard.press(back ? "Shift+Tab" : "Tab");
    // The focused element's name: its aria-label, its <label>, or its text.
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (el === null) return "";
      const label = "labels" in el ? (el.labels as NodeListOf<HTMLLabelElement>)[0] : undefined;
      const name = el.getAttribute("aria-label") ?? label?.textContent ?? el.textContent ?? "";
      return name.trim().replace(/\s+/g, " ");
    });
    if (focused === name) return presses;
  }
  throw new Error(`never reached "${name}"`);
}

async function newDraft(page: Page): Promise<void> {
  await signIn(page);
  await page.goto("./#/customers?q=stonegate");
  await tabTo(page, "Stonegate Storage Centers LLC");
  await page.keyboard.press("Enter");
  await tabTo(page, "New quote");
  await page.keyboard.press("Enter");
  // An empty draft opens on its entry row.
  await expect(page.getByRole("combobox", { name: "Add a product" })).toBeFocused();
}

async function addLine(page: Page, search: string, quantity: string): Promise<void> {
  await page.keyboard.type(search);
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Enter");
  await page.keyboard.type(quantity);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("combobox", { name: "Add a product" })).toBeFocused();
}

test("the skip link moves the focus into the page without leaving it", async ({ page }) => {
  await signIn(page);
  await page.goto("./#/customers?q=stonegate");
  await tabTo(page, "Skip to content", true);
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/#\/customers\?q=stonegate$/);
  await expect(page.locator("#main")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Search")).toBeFocused();
});

test("changing a filter keeps the focus on it", async ({ page }) => {
  await signIn(page);
  await tabTo(page, "Status");
  const status = page.getByLabel("Status");
  await page.keyboard.press("ArrowDown");
  await expect(page).toHaveURL(/status=draft/);
  await expect(status).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page).toHaveURL(/status=pending_approval/);
  await expect(status).toBeFocused();

  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await expect(page).toHaveURL(/mine=1/);
  await expect(page.getByLabel("Only mine")).toBeFocused();
});

test("Load more puts the focus on the first quote it loaded", async ({ page }) => {
  await signIn(page);
  await tabTo(page, "Load more");
  await page.keyboard.press("Enter");

  await expect(page.getByText("100 of 161 quotes.", { exact: true })).toBeVisible();
  await expect(page.locator("#quote-rows tr:nth-child(51) a")).toBeFocused();
});

test("the builder keeps the focus where the rep works", async ({ page }) => {
  await newDraft(page);
  const product = page.getByRole("combobox", { name: "Add a product" });
  await addLine(page, "FST-0063", "60");
  await addLine(page, "OFP-0036", "12");

  // The option Enter would pick draws the focus ring; leaving with Tab closes the options.
  await page.keyboard.type("glove");
  await page.keyboard.press("ArrowDown");
  const active = page.locator("#line-options [aria-selected='true']");
  await expect(active).toContainText("SAF-0936");
  await expect(active).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Tab");
  await expect(product).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("listbox", { includeHidden: true })).toBeHidden();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("Backspace");

  // "Why this price" keeps the focus on the button it pressed.
  await tabTo(page, "Why this price", true);
  await tabTo(page, "Quantity of FST-0063", true);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.locator("#why-0")).toBeFocused();
  await expect(page.locator("#why-0")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: /^Why FST-0063 costs/ })).toBeVisible();

  // Undo is three Tabs from the product search and waits for the rep, however long it takes.
  await tabTo(page, "Remove OFP-0036");
  await page.keyboard.press("Enter");
  await expect(product).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const undo = page.getByRole("button", { name: "Undo" });
  await expect(undo).toBeFocused();
  await page.waitForTimeout(6_000);
  await expect(undo).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Quantity of OFP-0036")).toHaveValue("12");
});

test("a missing reason puts the focus in the reason field", async ({ page }) => {
  await newDraft(page);
  await tabTo(page, "Cancel draft");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Reason (required)")).toBeFocused();
  await tabTo(page, "Cancel quote");
  await page.keyboard.press("Enter");

  await expect(page.getByRole("alert")).toContainText("Say why the quote is cancelled");
  await expect(page.getByLabel("Reason (required)")).toBeFocused();
});

test("sending opens on Keep it, and Escape returns to Send to customer", async ({ page }) => {
  await newDraft(page);
  await addLine(page, "FST-0063", "60");
  await tabTo(page, "Submit for approval");
  await page.keyboard.press("Enter");
  const number = (await page.locator(".quote-head .eyebrow").textContent()) ?? "";
  await page.goto("./#/moderator/approve-latest");
  await page.goto("./#/quotes");
  await tabTo(page, number);
  await page.keyboard.press("Enter");
  await tabTo(page, "Send to customer");

  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Send to customer?" });
  await expect(dialog.getByRole("button", { name: "Keep it" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Send to customer" })).toBeFocused();
});
