# Quotes

## Purpose

Find any quote of the tenant, see where each one stands and open it; start a new one.

## Who and what they can do

| Role          | Sees                      | Can                         |
| ------------- | ------------------------- | --------------------------- |
| Sales rep     | Every quote of the tenant | Filter, open, start a quote |
| Sales manager | The same                  | The same                    |
| Admin         | The same                  | The same                    |

Quotes started by an integration (`erp-mcp-server`, `ops-copilot`) appear like any other, with the
integration's name as their creator.

## Pattern

SAP Fiori's
[list report](https://experience.sap.com/fiori-design-web/v1-84/list-report-floorplan-sap-fiori-element):
a filter bar over a table of many items, each row opening an object page. Row layout follows Shopify
Polaris's [index table](https://polaris.shopify.com/components/index-table): one row per object, the
identifier first, the status as a badge. Pages follow Shopify's
[guidance for cursor pagination](https://shopify.dev/docs/apps/build/app-home/migrate-from-polaris-react/pagination):
previous and next, with the cursor in the URL so that a page survives a reload and the Back button,
and back to the first page whenever the filters or the sort change.

## Data

From `GET /api/v1/quotes` (cursor pages of 50).

| Column      | Content                                           | Notes                                 |
| ----------- | ------------------------------------------------- | ------------------------------------- |
| Number      | `NF-2026-000132`, with `-R2` for a revision       | Link to the quote                     |
| Customer    | Name and account number                           | `customer` (pricewright-api ADR-0029) |
| Status      | Badge: Draft, Pending approval, Approved, Sent, … | Unknown statuses show their raw value |
| Total       | Total with its currency, right-aligned            | Tabular figures                       |
| Valid until | Date; "Expires in 3 days" when within a week      | Only for open quotes                  |
| Created by  | The rep or integration                            | `created_by.name`                     |
| Updated     | Relative time of the last status change           | Absolute time in a tooltip            |

Filters (in the URL): status (one of the API's statuses, or any), customer (a typeahead over
`GET /api/v1/customers?q=`), number, created by (me / anyone). Sort (`sort`): newest first by
default, oldest first, or by validity, ending soonest or latest first: the orders the API offers.

## Actions

- **New quote:** opens the customer picker; picking one starts a draft (`POST /api/v1/quotes` with
  an `Idempotency-Key`) and opens the builder.
- **Open a quote:** the row or its number; Enter on a focused row.
- **Pages:** 50 quotes a page, with "Previous page" and "Next page". The URL keeps the filters, the
  sort and the cursor of every page walked through (`cursor`, once per page): the API only pages
  forward (pricewright-api ADR-0014), so that trail is what lets "Previous page" work after a reload
  or from a shared link. Changing a filter or the sort goes back to the first page, since a cursor
  belongs to the query that returned it; a cursor the API refuses (an edited link) does too.

## States

| State    | What the user sees                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| Loading  | The filter bar and a table skeleton of 8 rows; the rows on screen stay while a new filter or page loads.     |
| Empty    | No quotes at all: "No quotes yet. Start one and the pricing engine will price every line." with "New quote". |
| No match | "No quotes match these filters." with "Clear filters".                                                       |
| Error    | The table area says what failed and "Try again", with the `request_id`.                                      |
| Success  | Rows; "Next page" while `next_cursor` is set, "Previous page" from the second page on.                       |

## Layout

- 1280 px: every column.
- 768 px: Created by and Updated fold under Number.
- Phone: each quote becomes a two-line card (number and status; customer and total). Not a primary
  phone screen, but usable.

## Keyboard and accessibility

- `/` focuses the filter bar's search (off with the user's character-key setting); arrow keys move
  between rows while the table has focus; Enter opens one.
- Changing a filter keeps the focus on it; a new page focuses its first quote and announces which
  quotes it shows ("Quotes 51 to 100").
- Without JavaScript the filter bar is a form that submits with its button, and the pages are plain
  links.
- The table is a real `<table>` with column headers; status badges carry their text, not only a
  color.

## Copy

- Title: "Quotes"; primary button: "New quote".

## API needs

- ~~**Names in summaries**~~: done in pricewright-api 0.10.0 (ADR-0029): each item carries
  `customer` (id, name, account number) and `created_by.name`.
- **Several statuses in one filter**, such as everything still open (draft, pending approval,
  approved, sent): the API takes one `status`. The list filters by one until the usability test
  shows the need.
- **Sort by total:** the API sorts by creation and by validity only, and every sort needs its index
  (pricewright-api ADR-0014). Also after the usability test.
