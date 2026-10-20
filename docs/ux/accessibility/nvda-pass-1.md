# NVDA pass 1 — the clickable prototype

The screen-reader pass of handbook §14.3, on the same journeys as
[keyboard pass 1](keyboard-pass-1.md). The maintainer runs it; this file holds the plan and, once
run, what NVDA actually said. Nothing here is filled in until then.

- **Status:** not run yet.
- **Setup:** the current NVDA release with Chrome, the most common NVDA pairing in WebAIM's tenth
  screen reader survey (21.3% of respondents, against 10.0% for NVDA with Firefox;
  [WebAIM](https://webaim.org/projects/screenreadersurvey10/)). Record both versions below.
- **Build:** the prototype on GitHub Pages at the commit named below, after `?reset`.
- **Recording what was heard:** NVDA menu → Tools → Speech viewer shows every utterance; copy the
  relevant lines into the table, shortened but in NVDA's words.

| Field  | Value |
| ------ | ----- |
| Date   |       |
| NVDA   |       |
| Chrome |       |
| Commit |       |

## Checks

Move with Tab and Shift+Tab in focus mode, and with H (headings), D (landmarks) and the arrow keys
in browse mode. "Expected" is what the markup should produce; "Heard" is what NVDA said.

| #   | Journey and step                                      | Expected                                                                        | Heard | Result |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------- | ----- | ------ |
| N1  | Sign in: load the page                                | "Sign in to Pricewright", then the Email field with its label                   |       |        |
| N2  | Sign in with a wrong email                            | The error read once (`role="alert"`), the focus back on Email                   |       |        |
| N3  | Quotes after signing in                               | The page heading "Quotes" announced as the route changes                        |       |        |
| N4  | Quotes: change Status with the arrow keys             | Each status read; the focus stays on the select                                 |       |        |
| N5  | Quotes: Load more                                     | "Showing 100 of 161 quotes." and the 51st quote's number                        |       |        |
| N6  | Task 1: customer search, typing "stonegate"           | "4 customers" read after typing stops (live count)                              |       |        |
| N7  | Task 2: type in "Add a product"                       | A combobox, expanded; Down Arrow reads each option's SKU and name               |       |        |
| N8  | Task 2: Enter on an option, then a quantity and Enter | The Quantity field, then "Total … USD" once per line added                      |       |        |
| N9  | Task 2: Remove a line                                 | "… removed. Undo" read from the toast                                           |       |        |
| N10 | Task 2: Submit for approval                           | "Submitted. A manager will decide on it…" read after the page redraws           |       |        |
| N11 | Task 3: "Why this price" on FST-0063                  | A toggle button, pressed; the breakdown list "How FST-0063 is priced" readable  |       |        |
| N12 | Task 4 (phone width): the approval inbox              | Each link starts with the reason ("17.3% off list…"): is the customer findable? |       |        |
| N13 | Task 4: Reject with an empty comment                  | "Say what should change…" read, the focus in the comment                        |       |        |
| N14 | Task 4: Approve                                       | "Approved NF-2026-000132…" read                                                 |       |        |
| N15 | Task 5: Send to customer                              | The dialog's name "Send to customer?", its text, then the focus on "Keep it"    |       |        |
| N16 | Task 5: confirm sending                               | "Sent to purchasing@… Replies go to Taylor Brooks." read                        |       |        |
| N17 | Any page: Skip to content                             | The link read first; activating it lands in the main content                    |       |        |

Results: `Pass`, `Fail` (what was wrong, in the Heard column) or `Unclear`. Each fail becomes a
finding with a severity and a fix, as in the keyboard pass.

## Known risks to listen for

- **Messages that arrive with a redraw** (N10, N14, N16): the prototype re-renders the page with a
  `role="status"` element that already holds its text. Screen readers often announce a live region
  only when its content changes after it is in the page, so these may be silent.
- **Route changes** (N3): the focus moves to each page's heading (`tabindex="-1"`); NVDA should read
  it, but the page title is not announced by itself.
- **The inbox's link names** (N12): reason first, then customer, total, number, rep and age, all in
  one link. Long, and the customer is not first.
