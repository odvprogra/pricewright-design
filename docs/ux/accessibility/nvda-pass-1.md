# NVDA pass 1 — the clickable prototype

The screen-reader pass of handbook §14.3, on the same journeys as
[keyboard pass 1](keyboard-pass-1.md): what NVDA said at each step, and the fixes for what it did
not say.

- **Status:** run on 2026-10-28. 10 of 17 checks passed; the 7 failures came from 5 problems, plus
  one more heard along the way (S6), all fixed (#35, #36). The whole pass was run again on `main`
  with both fixes: the 17 checks pass.
- **Setup:** NVDA with Chrome, the most common NVDA pairing in WebAIM's tenth screen reader survey
  (21.3% of respondents, against 10.0% for NVDA with Firefox;
  [WebAIM](https://webaim.org/projects/screenreadersurvey10/)).
- **Build:** the prototype built locally (`node scripts/site.ts`) and served on `localhost`, each
  check from `?reset`: `main` at 8c3de2b before the fixes, at 7cd2fbb after them.

| Field  | Value                                                                 |
| ------ | --------------------------------------------------------------------- |
| Date   | 2026-10-28                                                            |
| NVDA   | 2026.2 (AMD64), portable, as packaged by Guidepup (`0.2.1-2026.2`)    |
| Chrome | 156.0.8078.73, at 1280 × 900; task 4 at the Pixel 7 viewport (412 px) |
| Commit | Before: 8c3de2b. After: 7cd2fbb (#35, #36)                            |

## Method

A script drove NVDA and Chrome together: [Guidepup](https://www.guidepup.dev/) 0.35.0 started NVDA
and sent the keys through the operating system, so NVDA handled each Tab, arrow key and Enter as it
would a person's, in browse or focus mode; Playwright 1.64.1 opened the pages and typed text into
fields. NVDA's voice was set to silence and its log to the input/output level, which records every
key it received and every utterance it sent to speech: the same text as its Speech viewer. Each
check's "Heard" is that log between the key and the moment speech settled, shortened but in NVDA's
words.

Guidepup's own capture was not used for the results: it often kept only a step's first utterance.
Compared with NVDA's log on the same run, it missed what NVDA said after a focus change (the error
in N2, the count in N5), which would have turned passes into failures.

**Limits.** No person listened: the log shows what NVDA sent to speech, not how it sounds, and with
the voice silenced, an utterance cut short by the next one cannot be told apart. One reader and one
browser: JAWS, VoiceOver and Firefox were not tried, and task 4 ran at a phone's width in desktop
Chrome, not with TalkBack or VoiceOver on a phone. Severity follows axe's impact levels (critical,
serious, moderate, minor;
[axe-core](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#results-object)), as in the
keyboard pass.

## Checks

Move with Tab and Shift+Tab in focus mode, and with H (headings), D (landmarks) and the arrow keys
in browse mode. "Expected" is what the markup should produce; "Heard" is what NVDA said before the
fixes; for a failure, "After" is what it said on 7cd2fbb. Every check passed on 7cd2fbb.

| #   | Journey and step                                      | Expected                                                                        | Heard                                                                                                                                                                                                                                                              | Result                            |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| N1  | Sign in: load the page                                | "Sign in to Pricewright", then the Email field with its label                   | "Sign in · Pricewright, document", "main landmark", "form landmark", "Email, edit, required, blank"                                                                                                                                                                | Pass (the page title, not the h1) |
| N2  | Sign in with a wrong email                            | The error read once (`role="alert"`), the focus back on Email                   | "Email, edit, required, `nobody@example.com`", "alert, That email and password don't match. After several failed attempts the account locks; your admin can unlock it."                                                                                            | Pass                              |
| N3  | Quotes after signing in                               | The page heading "Quotes" announced as the route changes                        | "heading, level 1", "main landmark, Quotes, heading, level 1"                                                                                                                                                                                                      | Pass                              |
| N4  | Quotes: change Status with the arrow keys             | Each status read; the focus stays on the select                                 | "main landmark", "Filter quotes, search landmark", "Status, combo box, Draft, collapsed"; then the same with "Pending approval"                                                                                                                                    | Pass                              |
| N5  | Quotes: Load more                                     | "Showing 100 of 161 quotes." and the 51st quote's number                        | "main landmark, table, with 101 rows and 7 columns, row 52, Number, column 1, NF-2026-000101, link", "Showing 100 of 161 quotes."                                                                                                                                  | Pass                              |
| N6  | Task 1: customer search, typing "stonegate"           | "4 customers" read after typing stops (live count)                              | "search landmark", "Search, edit, stonegate". After: the same, then "4 customers"                                                                                                                                                                                  | Fail: S2                          |
| N7  | Task 2: type in "Add a product"                       | A combobox, expanded; Down Arrow reads each option's SKU and name               | "list item" five times while typing, then "FST-0063 Zinc-Plated Sleeve Anchor…, 1 of 8"; Down Arrow: "FST-0064 …, 2 of 8". After: "expanded", "8 products match. FST-0063 …, 1 of 8, is highlighted."; Down Arrow: "Matching products, list", "FST-0063 …, 1 of 8" | Fail: S4                          |
| N8  | Task 2: Enter on an option, then a quantity and Enter | The Quantity field, then "Total … USD" once per line added                      | "Quantity, edit, selected 1"; then "Lines, region", "form landmark", "Add a product, combo box, collapsed…", "Total 2,726.99 USD", and "Total 3,086.67 USD" for the second line                                                                                    | Pass                              |
| N9  | Task 2: Remove a line                                 | "… removed. Undo" read from the toast                                           | "Lines, region", "form landmark", "Add a product, combo box…", "Total 2,726.99 USD". After: "OFP-0036 removed. Undo is after the product search. Total 2,726.99 USD"                                                                                               | Fail: S3                          |
| N10 | Task 2: Submit for approval                           | "Submitted. A manager will decide on it…" read after the page redraws           | "main landmark, Stonegate Storage Centers LLC, heading, level 1". After: the same, then "Submitted. A manager will decide on it; you'll get an email."                                                                                                             | Fail: S1                          |
| N11 | Task 3: "Why this price" on FST-0063                  | A toggle button, pressed; the breakdown list "How FST-0063 is priced" readable  | "… Why this price, toggle button, pressed", "Total 2,726.99 USD"; H: "complementary landmark, WHY FST-0063 COSTS 42.3775, heading, level 2"; Down: "How FST-0063 is priced, list, with 4 items"                                                                    | Pass (S6 fixed)                   |
| N12 | Task 4 (phone width): the approval inbox              | Each link starts with the reason ("17.3% off list…"): is the customer findable? | "17.3% off list, above the 15% threshold, Stonegate Storage Centers LLC, 1,722.55 USDNF-2026-000132 · Taylor Brooks ·, 5 days ago, link". After: "… 1,722.55 USD,NF-2026-000132 …"                                                                                 | Fail: S5                          |
| N13 | Task 4: Reject with an empty comment                  | "Say what should change…" read, the focus in the comment                        | "Say what should change: the rep needs it to fix the quote.", "Comment (required to reject), edit, multi line…", "alert, Say what should change…"                                                                                                                  | Pass                              |
| N14 | Task 4: Approve                                       | "Approved NF-2026-000132…" read                                                 | "main landmark, Approvals, heading, level 1". After: the same, then "Approved NF-2026-000132. Taylor Brooks will get an email."                                                                                                                                    | Fail: S1                          |
| N15 | Task 5: Send to customer                              | The dialog's name "Send to customer?", its text, then the focus on "Keep it"    | "Send to customer?, dialog, The customer receives the quotation as a PDF at `purchasing@stonegate-storage-centers-llc.example`. Replies come back to you.", "section, Keep it, button"                                                                             | Pass                              |
| N16 | Task 5: confirm sending                               | "Sent to purchasing@… Replies go to Taylor Brooks." read                        | "banner landmark, Northfield Supply", "main landmark, Stonegate Storage Centers LLC, heading, level 1". After: the same, then "Sent to purchasing@… Replies go to Taylor Brooks."                                                                                  | Fail: S1                          |
| N17 | Any page: Skip to content                             | The link read first; activating it lands in the main content                    | Ctrl+Home: "same page, link, Skip to content"; Enter: "main landmark, Customers, heading, level 1, search landmark, Search…" (NVDA reads on from there); Tab: "Search, edit…"                                                                                      | Pass                              |

## Problems found and fixed

| #   | Where                 | Problem                                                                                                                     | Criterion | Severity | Fix |
| --- | --------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------- | -------- | --- |
| S1  | Quote, approval inbox | After Submit, Approve and Send only the heading was read: the outcome message was drawn with the page, as a live region     | 4.1.3     | Serious  | #35 |
| S2  | Customers             | The search's count ("4 customers") was never read: its live paragraph was redrawn with the results                          | 4.1.3     | Moderate | #35 |
| S3  | Builder               | Removing a line read only the new total: the undo toast was drawn with the builder, and a second message replaced the first | 4.1.3     | Moderate | #35 |
| S4  | Builder               | Typing in the product search read "list item" without a name on every key: each redrawn option was the active one           | 4.1.2     | Minor    | #36 |
| S5  | Approval inbox        | A request's amount and number were read as one word ("1,722.55 USDNF-2026-000132")                                          | —         | Minor    | #36 |
| S6  | Builder               | Opening a line's breakdown announced the unchanged total                                                                    | —         | Minor    | #35 |

- **S1–S3:** a live region that enters the page already holding its text is not announced reliably;
  one that stays in the page and gets new text is (Scott O'Hara,
  ["Are we live?"](https://www.scottohara.me/blog/2022/02/05/are-we-live.html)). The prototype
  redraws `<main>` on every change, so every message now goes through `#live`, the one region in
  `index.html` that no render replaces, as "Load more" already did (N5 passed). One action's
  messages are read together, in order. Errors stay `role="alert"` on elements that are in the page
  from the start; NVDA read them (N2, N13).
- **S4:** while typing, the focus stays in the field with no active option and no option marked
  selected; the first Down Arrow enters the list on the highlighted option, as the ARIA APG's
  [list autocomplete combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/)
  does. Once typing pauses for 1.4 s the number of matches and the highlighted one are announced, as
  GOV.UK's [accessible-autocomplete](https://github.com/alphagov/accessible-autocomplete) does ("8
  products match. FST-0063 …, 1 of 8, is highlighted.").
- **S5:** the link's parts are flex items, so no space separated them in its name; a visually hidden
  comma does.

The fixes are kept as tests in `tests/e2e/announcements.spec.ts` and `keyboard.spec.ts`; each failed
on the prototype before its fix.

## Heard but not changed

- **Re-renders repeat the landmarks:** each Status change (N4) and each search (N6) first reads
  "main landmark, Filter quotes, search landmark" or "search landmark" again, since the prototype
  replaces `<main>`; the value follows. The web app (M7) updates the list in place instead.
- **Route changes** read "heading, level 1" before the named heading (N3), and opening a request in
  the inbox reads the page's heading, "Approvals", as the route rule says; the request follows.
- **The breakdown's rows** read their parts without a pause ("List price51.23"), and the panel's
  heading is in capitals by CSS ("WHY FST-0063 COSTS 42.3775"); NVDA reads both as text.
- **The inbox's links** start with the reason, so the customer comes second, after about eight
  words; in a list of requests that share a reason, the customer is the part that differs. The
  usability test's task 4 will show whether that order slows managers down.
