# Documents

What a customer and a sales team receive from Pricewright outside the app: the quotation PDF and the
emails. They are the tenant's documents, in Ledger's type and rules
([ADR-0003](../adr/0003-the-ledger-brand-direction.md)): the tenant's name (its logo from M7) and
accent on top, Pricewright only in the closing line. pricewright-api renders them (its ADR-0027 and
ADR-0028) with the `tokens.css` of a pinned release (D-61).

The reference designs are code: `src/documents/` writes them from the tokens and Northfield's demo
data, the tests check them, and the brand guide's
[documents page](https://odvprogra.github.io/pricewright-design/documents.html) shows them.

## The quotation

[`src/documents/quotation.ts`](../../src/documents/quotation.ts), shown with quotation
NF-2026-000122, a sent quote of five lines.

### Page and type

- **A4**, margins 18 mm at the top, 16 mm at the sides, 20 mm at the bottom. A running footer: the
  quote's number on the left, "Page 1 of 2" on the right, `font.size.xs` in `color.text.muted`.
- **A 10 pt root**, so the rem-based size tokens print in proportion: body `md` (10 pt), the lines'
  table and the facts `sm` (8.75 pt), labels and the footer `xs` (7.5 pt).
- **"Quotation"** is the document's one serif heading (Source Serif 4 Semibold, `3xl`). Everything
  else is Public Sans: labels in small capitals tracked 0.08 em, amounts in tabular figures,
  right-aligned.
- **Fonts are embedded** from the OFL TrueType files with `@font-face`; WeasyPrint subsets them, so
  the PDF carries only the glyphs it uses. WOFF files are not used: WeasyPrint does not read them.
- **Pagination:** the lines' header repeats on every page (`display: table-header-group`), a line
  never splits (`break-inside: avoid`), and the totals and the notes stay whole.

### Content, top to bottom

| Part          | Content                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Masthead      | The tenant's logo (M7) or name; "Quotation"; facts: number, date, valid until, prepared by            |
| Tenant's rule | 2 pt in `color.tenant.accent`, the one place the tenant's color appears                               |
| Notice        | Only when the quote is not an offer (below)                                                           |
| Prepared for  | The customer's name and account (and tax ID when it has one)                                          |
| Lines         | Item (SKU), description, quantity with its unit, list price, discount, net price, amount              |
| Totals        | Subtotal, tax with its exact rate ("Tax (7.25%)"), the total with its currency                        |
| Notes         | The notes for the customer, when there are any                                                        |
| Closing       | Prices' currency and validity; "Northfield Supply, quotation NF-2026-000122, issued with Pricewright" |

- **Numbers:** amounts to the currency's minor units, grouped ("1,709.36"); list prices up to four
  places when they have them; **net prices always to four places**, so their column lines up as in
  the app's builder; discounts from list to one decimal ("8%", "17.3%"); the total as "USD 1,833.29"
  (voice and tone).
- **Dates** spelled in full in customer documents: "November 11, 2026".
- **Never** costs or margins, whoever prints the quote.

### Color and rules

- Text in `color.text.default`; labels, SKUs and the footer in `color.text.muted`.
- The lines' header on `color.surface.muted` over a `color.border.strong` rule; rows divided by
  `color.border.default`.
- **The grand total** sits between a `color.border.strong` rule and the accountant's double rule, 3
  pt `double` in `color.text.default`: the same rule that closes the logo's sheet.
- On screen (the guide, a browser preview) the sheet sits on `color.surface.muted` with `shadow.md`;
  print ignores both.

### When it is not an offer

A notice under the tenant's rule, semibold, in a status color's text on its surface:

| Quote                               | Notice                                                                | Tokens                   |
| ----------------------------------- | --------------------------------------------------------------------- | ------------------------ |
| Draft, pending approval or rejected | "Draft, not an offer: prices may change until the quote is approved." | `color.status.warning.*` |
| Expired                             | "This offer has expired: it was valid until November 13, 2026."       | `color.status.danger.*`  |
| Cancelled                           | "Cancelled: this quote is no longer an offer."                        | `color.status.danger.*`  |
| Superseded                          | "Replaced by a later revision: this quote is no longer an offer."     | `color.status.info.*`    |

## Emails

Next: the decision emails to the rep and the sent quotation to the customer.
