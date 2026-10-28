# Quote detail

## Purpose

Show a quote that is no longer a draft, exactly as the customer gets it, and offer the one or two
next steps its status allows.

## Who and what they can do

The actions come from the quote's `allowed_actions`, so the screen never offers what the API would
refuse. Typical cases:

| Status           | Sales rep                                      | Sales manager (not the builder) |
| ---------------- | ---------------------------------------------- | ------------------------------- |
| Pending approval | Recall (back to draft), cancel                 | Approve, reject                 |
| Approved         | Send to customer, download PDF, revise, cancel | The same                        |
| Sent             | Record acceptance, revise, cancel (declined)   | The same                        |
| Accepted         | Convert to order                               | The same                        |
| Rejected         | Revise, cancel                                 | The same                        |
| Expired          | Revise                                         | The same                        |
| Converted        | Open the order                                 | Open the order                  |
| Superseded       | Open the revision that replaced it             | The same                        |

Integrations never send, accept or convert (people only); a quote they started shows their name.

## Pattern

SAP Fiori's
[object page](https://www.sap.com/design-system/fiori-design-web/v1-71/page-types/floorplans/object-page/usage)
in display mode: header with identity, status and the main actions, then sections (lines, totals,
approvals, history).

## Data

From `GET /api/v1/quotes/{id}`.

- **Header:** number and revision, customer, status, valid until (with "Expires in 3 days"), the
  rep, the primary action.
- **Lines** as in the builder, read-only, each with its breakdown on demand.
- **Totals:** list subtotal, net subtotal and discount, tax, total.
- **Approvals:** each request of this revision: who asked, when, the reasons, the decision, who
  decided and their comment.
- **Revisions:** links to the revision it supersedes and the one that superseded it.
- **PDF:** `GET /api/v1/quotes/{id}/pdf`, what the customer receives.

## Actions

| Action            | Confirmation                                              | API              |
| ----------------- | --------------------------------------------------------- | ---------------- |
| Approve           | Optional comment                                          | `POST …/approve` |
| Reject            | Comment required: "What should change?"                   | `POST …/reject`  |
| Recall            | "Withdraw the approval request for NF-2026-000132?"       | `POST …/recall`  |
| Send to customer  | Names the recipient; warns when the customer has no email | `POST …/send`    |
| Record acceptance | "Stonegate accepted NF-2026-000132?"                      | `POST …/accept`  |
| Convert to order  | None; safe to retry (`Idempotency-Key`)                   | `POST …/convert` |
| Revise            | Explains that this revision becomes read-only             | `POST …/revise`  |
| Cancel            | Reason required; names the quote                          | `POST …/cancel`  |

Every action sends `If-Match`. After it, the screen shows the new status and the next step.

## States

| State       | What the user sees                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| Loading     | Header and section skeletons.                                                                         |
| Not found   | "This quote doesn't exist or isn't yours to see." (another tenant's quote is a 404 by design).        |
| Error       | The failed action's reason and `request_id`; the quote stays as it was.                               |
| Stale (412) | What changed and "Reload", as in the builder.                                                         |
| Expired     | A banner: "This offer expired on Nov 18, 2026. Revise it to offer it again."                          |
| Success     | A short confirmation naming the result: "Sent to `purchasing@stonegate-storage-centers-llc.example`". |

## Layout

- 1280 px: header across, lines and totals in the main column, approvals and revisions to the side.
- 768 px: one column, in reading order.
- **Phone (required, handbook §14.2):** header, the primary action as a full-width button, totals,
  then lines as cards; managers approve from here.

## Keyboard and accessibility

- The primary action is the first focusable control after the title.
- Sending opens its confirmation on "Keep it": an email can't be recalled.
- Confirmation dialogs trap focus, name the quote in their title and return focus to the action that
  opened them.

## Copy

- Send: "Send to customer" → "Sent to {email}. Replies go to {rep}."
- No customer email: "Stonegate has no email on file. Send marks the quote as sent; deliver the PDF
  yourself."

## API needs

- **Names:** `created_by`, `submitted_by` and the approvals' `requested_by` / `decided_by` are ids;
  the screen needs display names (as in [Quotes](quotes.md)).
