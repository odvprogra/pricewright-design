# Quote builder

## Purpose

Build a draft quote line by line, see why every price is what it is, and submit it knowing whether
it needs approval. The screen most of Pricewright's value runs through, and the main task of the
usability test.

## Who and what they can do

| Role          | Can                                                                               |
| ------------- | --------------------------------------------------------------------------------- |
| Sales rep     | Add, change and remove lines; change validity and notes; submit; cancel the draft |
| Sales manager | The same, plus override a line's price with a reason                              |
| Admin         | The same as a manager                                                             |

Shown for quotes in `draft` whose `allowed_actions` include `submit`; any other status opens the
[quote detail](quote-detail.md).

## Pattern

SAP Fiori's
[object page](https://www.sap.com/design-system/fiori-design-web/v1-71/page-types/floorplans/object-page/usage)
in edit mode: a header with the object's identity and status, then sections. The line table edits in
place, like the spreadsheet-style
[transaction line editor](https://trailhead.salesforce.com/content/learn/modules/efficient-sales-with-revenue-cloud/work-with-quotes)
of Salesforce's quoting, so reps never leave the table to add a product.

## Data

From `GET /api/v1/quotes/{id}`; every change returns the quote priced again with its new `ETag`.

- **Header:** number (with revision), customer name, account and tier, status, valid until, the rep.
  If the quote revises a rejected one, the manager's comment is pinned under the header.
- **Lines table:** SKU, product, quantity, unit, unit list price, net unit price, line total; margin
  and a margin-floor flag for people with `costs:read`.
- **Breakdown** of the selected line, from its `steps`: list price, then each stage that applied
  (volume tier, customer tier, promotion, manager override) with its label, rate and the unit price
  after it, then the net unit price and its discount from list.
- **Summary:** list subtotal, net subtotal with the discount from list, tax with its rate, total;
  and the approval check: the quote's discount against the tenant's threshold, and the lines below
  the margin floor (`requires_approval`, `approval_reasons`).
- **Terms:** valid until (defaults to the tenant's validity), notes for the customer.

## Actions

| Action          | How                                                                                                      | API                                       |
| --------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Add a line      | Type a SKU or name in the empty last row; pick; type the quantity; Enter                                 | `POST …/lines`                            |
| Change quantity | Edit the cell; saved on Enter or blur                                                                    | `PATCH …/lines/{line_id}`                 |
| Remove a line   | Row menu or Delete on a focused row; an Undo toast instead of a confirmation, kept until the next change | `DELETE …/lines/{line_id}`                |
| Override price  | Managers: a unit price or a rate, and a required reason                                                  | `PATCH …/lines/{line_id}` with `override` |
| Change terms    | Valid until, notes                                                                                       | `PATCH /api/v1/quotes/{id}`               |
| Submit          | Primary button; says what will happen ("Submit for approval" or "Submit")                                | `POST …/submit`                           |
| Cancel draft    | Secondary menu; confirmation naming the quote; reason required                                           | `POST …/cancel`                           |

Every change sends `If-Match` with the quote's `ETag`. Lines are repriced together after any change,
so the table updates every line's net price, not only the edited one.

## States

| State          | What the user sees                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| Loading        | Header and table skeletons.                                                                                           |
| Empty draft    | The empty row focused: "Type a SKU or product name to add the first line."                                            |
| Pricing        | After a change, the affected amounts show a pending style until the repriced quote arrives (< 1 s expected).          |
| Error          | A failed change keeps the user's input in the cell with the reason and the `request_id`; nothing is lost.             |
| Stale (412)    | "Morgan changed this quote after you opened it." Shows what changed; "Reload" keeps nothing of the failed change.     |
| Needs approval | The summary shows the reason before submitting: "16.4% off list, above your 15% threshold."                           |
| Archived item  | A line whose product was archived must be removed before any other change: the line says so, with "Remove line".      |
| Success        | Submit goes to the quote detail with a confirmation: "Submitted. Waiting for approval." or "Approved. Ready to send." |

## Layout

- 1280 px: the table and the breakdown side by side; the summary and Submit stay visible at the
  bottom of the viewport.
- 768 px: the breakdown opens under the selected row.
- Phone: read-only summary with "Open on a larger screen to edit lines"; building on a phone is not
  a goal (handbook §14.2 requires the detail and the inbox there, not the builder).

## Keyboard and accessibility

- Keyboard-first entry: the product search is a combobox (ARIA 1.2); Enter adds the line and moves
  to its quantity; Enter again returns to a new empty row. While the rep types, the focus stays in
  the field and the first match is highlighted for Enter; Down Arrow enters the list on it (ARIA APG
  list autocomplete), and the number of matches is announced once typing pauses (1.4 s, as GOV.UK's
  accessible-autocomplete).
- Arrow keys move between cells; `b` opens the selected line's breakdown (while the lines table has
  focus); `Ctrl+Enter` submits. "Why this price" keeps the focus on the button pressed.
- Repriced amounts are announced politely ("Total 3,086.67 USD") through one live region, not one
  per cell.

## Copy

- Empty row placeholder: "SKU or product name"
- Submit: "Submit for approval" when `requires_approval`, otherwise "Submit"
- Override reason label: "Why this price? (kept in the audit trail)"

## API needs

- None blocking. The product search uses `GET /api/v1/products?q=` (archived products excluded with
  `active=true`).
