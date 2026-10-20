# Keyboard pass 1 — the clickable prototype

The keyboard-only pass that handbook §14.3 asks for on the critical journeys before a UI milestone
closes, run on the [prototype](../../../prototype/README.md) before the first usability sessions.
The screen-reader pass is a separate record: [NVDA pass 1](nvda-pass-1.md).

- **Date:** 2026-10-20.
- **Build:** `main` at 5e5c3db (before), then at 11b217b (after #28 and #29).
- **Result:** 13 problems found, all fixed; the journeys pass with the keyboard alone. The fixes are
  kept as tests: six in `tests/e2e/keyboard.spec.ts`, two in `tests/e2e/builder.spec.ts`.

## Method

Every journey was driven with the keys a keyboard user has (Tab, Shift+Tab, Enter, Space, the arrow
keys, Escape and typing), following WebAIM's keyboard testing table for each control
([WebAIM](https://webaim.org/techniques/keyboard/)) and the ARIA Authoring Practices for the
combobox and the modal dialog ([APG combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/),
[APG dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)).

The keys were sent through Playwright 1.64.1 to its Chromium 156, at 1280 × 900 and on its Pixel 7
profile for the approval inbox. After every key the script recorded the focused element and its
name, whether it drew an outline, and whether `elementFromPoint` found it at its center and four
corners (nothing covering it); screenshots were taken at each state worth seeing.

Criteria checked (WCAG 2.2, level A or AA): 2.1.1 Keyboard, 2.1.2 No Keyboard Trap, 2.1.4 Character
Key Shortcuts, 2.2.1 Timing Adjustable, 2.4.1 Bypass Blocks, 2.4.3 Focus Order, 2.4.7 Focus Visible,
2.4.11 Focus Not Obscured (Minimum), 3.2.1 On Focus, 3.2.2 On Input, and 1.4.11 Non-text Contrast
for focus rings and states.

**Limits.** A script pressed the keys, not a person at a keyboard; it shows where the focus goes,
not how it feels to follow. Firefox and Safari were not tried. Severity follows axe's impact levels
(critical, serious, moderate, minor;
[axe-core](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#results-object)).

## Journeys

| Journey                                               | Keys after the fixes                                                                                                            | Result |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Sign in                                               | Type, Tab, type, Enter; a wrong email returns the focus to the email field                                                      | Pass   |
| Quotes: filters, Load more, New quote dialog          | 2 Tabs to Status, arrows change it in place; Load more lands on the 51st quote; Escape and Cancel return to New quote           | Pass   |
| Task 1: Stonegate's payment terms                     | 2 Shift+Tabs to Customers, Enter, Tab, type, Tab, Enter                                                                         | Pass   |
| Task 2: build the five-line quote and submit it       | The draft opens on the product search; each line is type, Enter, quantity, Enter; Undo is 3 Tabs away; Submit 5 Tabs after Undo | Pass   |
| Task 3: why FST-0063 costs 42.3775                    | Shift+Tab to the line's "Why this price", Enter; the focus stays on it and the panel explains the price                         | Pass   |
| Task 4 (phone profile): approve one quote, reject one | Tab to the request, Enter; Tab to the comment, type, Tab to Reject, Enter; an empty comment returns the focus to the comment    | Pass   |
| Task 5: send the approved quote                       | Tab to Send to customer, Enter; the dialog opens on Keep it; Escape returns to Send to customer                                 | Pass   |
| Cancel a draft; reject from the quote's page          | The dialogs open on their first field; a missing reason or comment keeps the focus in it                                        | Pass   |

Every stop drew the focus ring, and no focused control was covered. Inside a modal `<dialog>`, Tab
after the last button moves to the browser's own controls and then back into the dialog: that is the
platform's behavior for native modal dialogs (the page behind stays inert), not a trap.

## Problems found and fixed

| #   | Where              | Problem                                                                                                          | Criterion         | Severity | Fix |
| --- | ------------------ | ---------------------------------------------------------------------------------------------------------------- | ----------------- | -------- | --- |
| K1  | Builder            | The product options were clipped by the table's scroll container: 1 of 8 drawn on an empty draft, for every user | (all users)       | Critical | #28 |
| K2  | Builder            | "Cancel draft" opened nothing: its dialog was only rendered on the quote's page                                  | (all users)       | Serious  | #28 |
| K3  | Every page         | The skip link pointed at `#main`, which the hash router read as a route: it left the page for Quotes             | 2.4.1             | Serious  | #29 |
| K4  | Quotes             | The first arrow key on Status, or Space on Only mine, re-rendered the list and moved the focus to the heading    | 3.2.2             | Serious  | #29 |
| K5  | Builder            | The undo toast vanished after 5 s, also while focused (the focus fell to the page); it was 10 Tabs away          | 2.2.1, 2.4.3      | Serious  | #29 |
| K6  | Builder            | The focus ring on Undo was the light-surface blue on the dark toast: 2.31:1                                      | 1.4.11            | Serious  | #29 |
| K7  | Builder            | The option Enter would pick was marked only by the hover tint, 1.16:1 on white                                   | 1.4.11            | Moderate | #29 |
| K8  | Builder            | "Why this price" moved the focus to the line's quantity field                                                    | 2.4.3             | Moderate | #29 |
| K9  | Quotes             | Load more sent the focus back to the heading, 50 rows above the new ones                                         | 2.4.3             | Moderate | #29 |
| K10 | Quote: send dialog | It opened on "Send to customer", so a second Enter sent an email that can't be recalled                          | APG dialog        | Moderate | #29 |
| K11 | Builder            | The options stayed open, hidden from the focus, after Tab left the search                                        | APG combobox      | Minor    | #29 |
| K12 | Builder            | An empty draft opened on the heading instead of the product search its spec names                                | Spec              | Minor    | #29 |
| K13 | Cancel, reject     | A missing reason or comment showed the error but left the focus on the button                                    | Spec (as sign-in) | Minor    | #29 |

How the fixes follow practice:

- **K4:** WCAG 3.2.2 lists a focus change as a change of context
  ([Understanding 3.2.2](https://www.w3.org/WAI/WCAG22/Understanding/on-input.html)). The view now
  asks the shell to keep the focus on the control the user changed; route changes still focus the
  page's heading.
- **K5:** a toast with an action does not dismiss itself (the UK Intelligence Community Design
  System's
  [toast guidance](https://github.com/mi6/ic-design-system/blob/main/src/content/structured/components/feedback-progress/toasts/accessibility.mdx);
  Atlassian keeps important flags on screen,
  [Atlassian flag](https://atlassian.design/components/flag/usage)). Undo now stays until the next
  change to the quote, and sits right after the entry row in the tab order. While it shows, the page
  keeps a bottom scroll padding so it never covers a focused control (technique C43 for 2.4.11).
- **K9:** the first new item takes the focus and the new count is announced, as eBay's "pulldown
  list" pattern does after "Show more"
  ([eBay](https://opensource.ebay.com/evo-web/accessibility/patterns/pulldown-list)).
- **K10:** for a final step that can't be undone, the APG dialog pattern puts the focus on the least
  destructive action.

## What the specs change

The prototype implements no keyboard shortcuts. The specs promise single-key ones (`/` to search,
`j` / `k` in the inbox, `a` to approve, `r` to reject, `b` for a line's breakdown), and WCAG 2.1.4
(level A) requires each to be turned off, remapped to include a modifier, or active only while its
component has focus
([Understanding 2.1.4](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html)).
GitHub does both: a "Character keys" setting turns them off, and new ones must respect it
([GitHub](https://docs.github.com/en/account-and-profile/how-tos/account-settings/managing-accessibility-settings),
[Primer](https://primer.style/accessibility/patterns/keyboard-shortcuts)). The
[screen specs](../screens/README.md) now say the same for `pricewright-web`: letter shortcuts only
while their list or table has focus, `/` (a page-wide one) behind a user setting that turns all
character-key shortcuts off. They also take K4, K5, K9, K10 and K12 as rules.

## For the screen-reader pass

Things this pass could not judge and [NVDA pass 1](nvda-pass-1.md) checks: whether moving the focus
to the heading announces a route change; whether messages that arrive with a re-render
(`role="status"` inserted with its text) are read; how the combobox's active option and the
repricing announcement ("Total 5,186.19 USD") sound; and the approval inbox's links, which start
with the reason before the customer.
