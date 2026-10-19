# Approval inbox

## Purpose

Let a manager see every quote waiting for a decision, understand at once why each one needs it, and
approve or reject it, on a desktop or a phone, without leaving the inbox.

## Who and what they can do

| Role          | Sees                                                                              | Can                                                     |
| ------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Sales manager | Every pending request of the tenant                                               | Approve or reject, except quotes they built (four eyes) |
| Admin         | The same                                                                          | The same                                                |
| Sales rep     | Not in the navigation; their own pending quotes are in Quotes, filtered by status | —                                                       |

The API lets anyone with `quotes:read` read the inbox; the navigation shows it to people with
`quotes:approve`.

## Pattern

SAP Fiori's [worklist](https://experience.sap.com/fiori-design-web/v1-86/work-list): "a collection
of items a user needs to process", where deciding which one to process first is part of the job. On
a phone it becomes a master-detail list: the inbox, then one request full screen.

## Data

From `GET /api/v1/approval-requests` (pending, oldest first, so nothing waits longest unseen).

Each request shows, in this order:

1. **Why it needs approval**, from `reasons`, in words: "16.4% off list, above the 15% threshold"
   (`discount`, `approval_threshold`), "2 lines below the margin floor". Unknown reasons show a
   generic "Needs approval".
2. Quote number, customer, total and net subtotal.
3. Requested by and how long ago.

Opening a request shows the quote's lines with their breakdowns and margins (from the quote,
`GET /api/v1/quotes/{id}`), the lines below the margin floor first.

## Actions

| Action  | How                                                                 | API                                |
| ------- | ------------------------------------------------------------------- | ---------------------------------- |
| Approve | One button; an optional comment                                     | `POST /api/v1/quotes/{id}/approve` |
| Reject  | Opens a required comment: "What should Taylor change?"              | `POST /api/v1/quotes/{id}/reject`  |
| Next    | After a decision, the next request opens; the inbox count goes down | —                                  |

Both send `If-Match` with the quote's `ETag`. The rep receives an email with the decision (sent by
pricewright-api's worker).

## States

| State     | What the user sees                                                                                               |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| Loading   | List skeleton of 5 items.                                                                                        |
| Empty     | "Nothing waits for your approval." with the time it was last checked; no call to action.                         |
| Error     | The reason and "Try again", with the `request_id`.                                                               |
| Own quote | The decision buttons are replaced by "You built this quote; another manager must decide."                        |
| Gone      | The quote was recalled, decided by someone else or expired meanwhile: "Already handled", and it leaves the list. |
| Success   | "Approved. Taylor will get an email." and the next request.                                                      |

## Layout

- 1280 px: the list on the left (a third), the open request on the right.
- 768 px: the same, the list narrower.
- **Phone (required, handbook §14.2):** the list full width; a request full screen with its reason,
  totals and the two buttons fixed at the bottom; lines collapsed under "Show lines". Deciding takes
  two taps (Approve) or a short comment (Reject).

## Keyboard and accessibility

- `j` / `k` move through the list; `a` approves, `r` opens the rejection comment (both ask for
  confirmation with Enter).
- The count of pending requests is in the page title and the navigation ("Approvals, 3 waiting").

## Copy

- Title: "Approvals"
- Reason: "{discount} off list, above the {threshold} threshold"; "{n} lines below the margin floor"
- Reject placeholder: "Say what to change so the quote can be approved."

## API needs

- **Can the caller decide this one?** The inbox item has no flag for four eyes, so the screen
  compares `requested_by` with the user; a quote the manager built but someone else submitted is
  only known from the quote (pricewright-api follow-up: "can the caller decide this one").
- **Names:** `requested_by` and the quote summary's `customer_id` are ids (as in
  [Quotes](quotes.md)).
