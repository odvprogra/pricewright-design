# Customers

## Purpose

Find a customer to quote, see its terms and its quotes, and keep its details current.

## Who and what they can do

| Role          | Can                                                            |
| ------------- | -------------------------------------------------------------- |
| Sales rep     | Search, open, add and edit customers; archive and restore them |
| Sales manager | The same                                                       |
| Admin         | The same                                                       |

## Pattern

A list report with an object page per customer (SAP Fiori,
[list report](https://experience.sap.com/fiori-design-web/v1-84/list-report-floorplan-sap-fiori-element)),
the list as an [index table](https://polaris.shopify.com/components/index-table) (Shopify Polaris).

## Data

**List** (`GET /api/v1/customers`): account number, name, tier (Standard, Silver, Gold), payment
terms ("Net 30", "Due on receipt" for 0), email, archived badge. Search `q` over name and account
number; filters tax id, tier and active (active only by default). Sort by name, account number or
newest.

**Customer page** (`GET /api/v1/customers/{id}`): the same fields, editable, plus the customer's
quotes (`GET /api/v1/quotes?customer_id=`) and orders (`GET /api/v1/orders?customer_id=`), newest
first.

## Actions

| Action          | How                                                                    | API                            |
| --------------- | ---------------------------------------------------------------------- | ------------------------------ |
| New quote       | From the customer page or a row's menu                                 | `POST /api/v1/quotes`          |
| Add customer    | A form: account number and name required; tier, terms, tax id, email   | `POST /api/v1/customers`       |
| Edit            | Edit in place on the customer page; save                               | `PATCH /api/v1/customers/{id}` |
| Archive/restore | Confirmation naming the customer; archived customers keep their quotes | `PATCH` with `is_active`       |

Creation sends an `Idempotency-Key`; edits send `If-Match`.

## States

| State       | What the user sees                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| Loading     | Table skeleton; on the customer page, field skeletons.                                                |
| Empty       | "No customers yet. Add the first one to start quoting." with "Add customer".                          |
| No match    | "No customer matches “stonegat”." with "Clear search".                                                |
| Error       | The reason and `request_id`; a validation error stays on its field ("Account C-0011 already exists"). |
| Stale (412) | What changed and "Reload".                                                                            |
| No email    | On the customer page: "Sent quotes reach this customer only by hand until you add an email."          |
| Success     | "Saved" next to the save button for 3 s.                                                              |

## Layout

- 1280 px: every column.
- 768 px: email and terms fold under the name.
- Phone: name, tier and account number per row; usable, not a primary phone screen.

## Keyboard and accessibility

- `/` focuses search; results update while typing (debounced 250 ms) and are announced as a count.
- Tier is text, not only a color.

## Copy

- Title: "Customers"; button: "Add customer"
- Archive: "Archive Stonegate Storage Centers LLC? Its quotes and orders stay as they are."

## API needs

None.
