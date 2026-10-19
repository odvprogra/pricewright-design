# Products

## Purpose

Look up what Northfield sells, at what list price and in which unit; for admins, keep the catalog
and its categories current.

## Who and what they can do

| Role          | Can                                                                   |
| ------------- | --------------------------------------------------------------------- |
| Sales rep     | Search and open products; see unit costs (`costs:read`)               |
| Sales manager | The same                                                              |
| Admin         | The same, plus add, edit, archive and restore products and categories |

Integrations reading the catalog never see unit costs; people with `costs:read` do.

## Pattern

A list report and an object page, as [Customers](customers.md).

## Data

**List** (`GET /api/v1/products`): SKU, name, category, unit ("Box", "Case", "Pack" from the UN/ECE
code; unknown codes show the code), list price, unit cost and margin for people with `costs:read`,
archived badge. Search `q` over name and SKU; filters category (`GET /api/v1/product-categories`)
and active. Sort by name, SKU or newest.

**Product page** (`GET /api/v1/products/{id}`): the same fields, editable by admins; the pricing
rules that apply to it (`GET /api/v1/pricing-rules?product_id=` and its category's), read-only.

## Actions

| Action          | Who   | API                                         |
| --------------- | ----- | ------------------------------------------- |
| Add product     | Admin | `POST /api/v1/products` (`Idempotency-Key`) |
| Edit            | Admin | `PATCH /api/v1/products/{id}` (`If-Match`)  |
| Archive/restore | Admin | `PATCH` with `is_active`                    |
| Add category    | Admin | `POST /api/v1/product-categories`           |

A change of list price affects drafts the next time they are priced, never a submitted quote: the
form says so.

## States

| State       | What the user sees                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| Loading     | Table skeleton.                                                                                                |
| Empty       | Admin: "The catalog is empty. Add a product or a category to begin." Others: "No products in the catalog yet." |
| No match    | "No product matches “sleeve ancor”." with "Clear search".                                                      |
| Error       | The reason and `request_id`; validation errors on their fields ("List price cannot be negative").              |
| Stale (412) | What changed and "Reload".                                                                                     |
| Success     | "Saved" next to the save button for 3 s.                                                                       |

## Layout

- 1280 px: every column; amounts right-aligned in tabular figures.
- 768 px: category and unit fold under the name.
- Phone: SKU, name and list price per row.

## Keyboard and accessibility

- `/` focuses search; results update while typing.
- Prices are read with their currency ("51.23 US dollars").

## Copy

- Title: "Products"; button (admins): "Add product"
- Price change note: "Drafts use the new price the next time they're priced. Submitted quotes keep
  theirs."

## API needs

- **Unit names:** the API returns UN/ECE codes (`XBX`); the web app maps the codes it knows to names
  and shows others as they are.
