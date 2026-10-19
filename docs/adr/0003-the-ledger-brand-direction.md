# 0003. The Ledger brand direction

- **Status:** Accepted
- **Date:** 2026-10-19

## Context

Pricewright needs one brand for the web app, the quote PDFs and the emails (handbook §14.6). Three
directions were explored on [one review page](../brand/explorations/directions.html), each with a
logo, a palette whose contrast is computed on the page, type, a voice and the same Northfield quote
rendered in it:

- **A. Waterfall:** a precision instrument; the logomark is the pocket-price waterfall (Marn and
  Rosiello, "Managing Price, Gaining Profit", HBR, 1992); cobalt, IBM Plex.
- **B. Workshop:** the craftsman in the name (D-13); a P whose bowl is a price tag; spruce and
  brass, a grotesque with Source Sans 3.
- **C. Ledger:** the document of record; a ruled sheet closed by the accountant's double rule under
  a total; navy and verdigris, Source Serif 4 with Public Sans.

Every direction kept the same constraints: text pairs at 4.5:1 and UI parts at 3:1 (WCAG 2.2 AA),
semantic colors independent of the brand, tenant accents only in the header, PDF and emails, and
open-licensed fonts (OFL) that WeasyPrint can embed.

## Decision

We will build Pricewright's brand on direction **C, Ledger**, chosen by the maintainer:

- Navy (`#1D2D50`) as the primary color, verdigris (`#0F766E`) as the accent, on white paper with
  cool neutrals; the semantic colors (success, warning, danger, focus) stay apart from both.
- Source Serif 4 for headings and for customer-facing documents (the PDF and the emails' headings);
  Public Sans for the interface, every table and every amount, in tabular figures.
- The logomark is the ruled sheet with the double rule, and the double rule closes every grand total
  in the app and on the PDF.
- The voice is formal and precise; customer-facing documents say "quotation", the app says "quote"
  ([voice and tone](../brand/voice-and-tone.md)).

Its two risks get rules of their own: serif type only from the heading sizes up, never in tables,
forms or dense lists; and the brand stays conservative on purpose, so its distinctiveness rests on
the mark, the double rule and the precision of the copy rather than on color.

## Alternatives considered

- **A. Waterfall:** the mark explains the pricing engine, but blue is the most common color in
  business software, and the direction leans on the mark alone to stand out.
- **B. Workshop:** the most distinctive among CPQ products' blues, but a green brand sits next to
  "success" and needs another hue for approved states, and its rounded shapes read informal on a
  PDF.

## Consequences

- **Positive:** the PDF, the emails and the app share a document-like look that suits quotations and
  an audit trail; navy leaves room for any tenant accent.
- **Negative:** serif headings need care at small sizes and in dense screens; a conservative brand
  is less memorable, which the logo and the copy must make up for.
