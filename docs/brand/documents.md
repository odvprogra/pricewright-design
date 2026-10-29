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
  the PDF carries only the glyphs it uses. The TrueType files are the ones the fonts' projects
  publish; WeasyPrint also decodes WOFF and WOFF2, which only save download size on the web.
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

[`src/documents/emails.ts`](../../src/documents/emails.ts), shown with Northfield's demo data: the
quotation NF-2026-000122 sent to its customer, Morgan Reyes approving NF-2026-000078 for Taylor
Brooks, and asking Jordan Patel for changes to NF-2026-000101. Each email has an HTML and a
plain-text part, written from the same blocks.

| Email               | To                    | Subject                                           | Heading                                 |
| ------------------- | --------------------- | ------------------------------------------------- | --------------------------------------- |
| Quotation sent      | The customer          | "Quotation NF-2026-000122 from Northfield Supply" | "Your quotation from Northfield Supply" |
| Quote approved      | The rep who submitted | "Quote NF-2026-000078 approved"                   | "Your quote is approved"                |
| Quote needs changes | The rep who submitted | "Quote NF-2026-000101 needs changes"              | "Your quote needs changes"              |

### Structure

- **One column, at most 600 px**, centered on `color.surface.muted`, the card on
  `color.surface.default` with a `color.border.default` edge. Layout tables carry
  `role="presentation"`, so screen readers skip them; the facts (quote, customer, total, validity)
  are a real table with row headers. `lang="en"` and `dir="ltr"` on the root.
- **The tenant's rule**, 4 px in its accent, tops the card; the tenant's name (its logo from M7, an
  image with its name as `alt`) sits under it. Pricewright appears only in the footer.
- **A preview line** follows the subject in the inbox, hidden in the body: the total and validity
  for the customer, the decision and the comment for the rep.
- **A manager's comment** is quoted (`blockquote`, a 3 px `color.border.strong` rule on
  `color.surface.muted`), right after who decided.
- **Voice:** customers read formal sentences without contractions ("The quotation is attached as a
  PDF"); reps read the app's voice ("It's ready to send"). A sentence that ends with a name ending
  in a period ("Co.") gets no second one.

### Type and color

- **Every style inline, every value copied from `tokens.json`:** mail clients drop `<style>` blocks
  and do not resolve `var()`. Sizes in pixels (a 16 px `md`), as clients handle `rem` unevenly.
- **No web fonts:** Gmail on the web and Outlook for Windows ignore `@font-face`
  ([caniemail](https://www.caniemail.com/features/css-at-font-face/)), so the emails use the tokens'
  stacks as they are: the heading in the serif stack (Source Serif 4 where installed, else Georgia),
  the rest in the sans stack (Public Sans, else Segoe UI, Helvetica Neue or Arial).
- **No numbers in headings:** Georgia sets old-style figures, so quote numbers and amounts go in the
  facts, in the sans stack's tabular figures.
- **Light only:** `color-scheme: light` until the tokens have a dark theme; images (the tenant's
  logo, from M7) carry their own light background so a client's forced dark mode cannot hide them.

### Practice followed

- The Email Markup Consortium's
  [yearly accessibility reports](https://emailmarkup.org/en/reports/accessibility/) find most emails
  miss both a `lang` attribute and `role="presentation"` on layout tables (84% of layout tables
  unmarked in 2026, as
  [Resend summarizes it](https://resend.com/blog/6-tips-for-accessible-emails)); both are here and
  tested.
- [Litmus on dark mode](https://www.litmus.com/blog/the-ultimate-guide-to-dark-mode-for-email-marketers):
  Apple Mail keeps an email's colors without the dark-mode meta tags, and other clients invert on
  their own; a light-only email with no transparent images survives both.
- Single column, 600 px and table layout, as transactional email guides advise
  ([Mailgun](https://www.mailgun.com/blog/email/transactional-html-email-templates/)).
