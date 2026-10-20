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
identifier first, the status as a badge.

## Data

From `GET /api/v1/quotes` (cursor pages of 50).

| Column      | Content                                           | Notes                                 |
| ----------- | ------------------------------------------------- | ------------------------------------- |
| Number      | `NF-2026-000132`, with `-R2` for a revision       | Link to the quote                     |
| Customer    | Name and account number                           | See API needs                         |
| Status      | Badge: Draft, Pending approval, Approved, Sent, … | Unknown statuses show their raw value |
| Total       | Total with its currency, right-aligned            | Tabular figures                       |
| Valid until | Date; "Expires in 3 days" when within a week      | Only for open quotes                  |
| Created by  | The rep or integration                            | See API needs                         |
| Updated     | Relative time of the last status change           | Absolute time in a tooltip            |

Filters (in the URL): status (multi-select of the API's statuses), customer (a typeahead over
`GET /api/v1/customers?q=`), number, created by (me / anyone). Sort: newest first by default; by
total or validity on request (`sort`).

## Actions

- **New quote:** opens the customer picker; picking one starts a draft (`POST /api/v1/quotes` with
  an `Idempotency-Key`) and opens the builder.
- **Open a quote:** the row or its number; Enter on a focused row.
- **Load more:** the next page by cursor, appended below; the URL keeps the filters, not the cursor.

## States

| State    | What the user sees                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| Loading  | The filter bar and a table skeleton of 8 rows; the previous rows stay while a new filter loads.              |
| Empty    | No quotes at all: "No quotes yet. Start one and the pricing engine will price every line." with "New quote". |
| No match | "No quotes match these filters." with "Clear filters".                                                       |
| Error    | The table area says what failed and "Try again", with the `request_id`.                                      |
| Success  | Rows, and "Load more" while `next_cursor` is set.                                                            |

## Layout

- 1280 px: every column.
- 768 px: Created by and Updated fold under Number.
- Phone: each quote becomes a two-line card (number and status; customer and total). Not a primary
  phone screen, but usable.

## Keyboard and accessibility

- `/` focuses the filter bar's search (off with the user's character-key setting); arrow keys move
  between rows while the table has focus; Enter opens one.
- Changing a filter keeps the focus on it; "Load more" focuses the first new row.
- The table is a real `<table>` with column headers; status badges carry their text, not only a
  color.

## Copy

- Title: "Quotes"; primary button: "New quote".

## API needs

- **Names in summaries:** `QuoteSummaryJson` carries `customer_id` and `created_by` as ids, and a
  rep cannot list users. The list needs the customer's name and account number and the creator's
  display name in each item (an additive change), instead of one lookup per row.
