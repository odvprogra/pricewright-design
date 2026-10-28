# 0005. Check tenant accents for contrast and meaning, with an accessible fallback

- **Status:** Accepted
- **Date:** 2026-10-20

## Context

A tenant brings one accent color and its logo (ADR-0003, ADR-0004: `color.tenant.accent` is the only
token a consumer overrides). The accent will appear in the app's header, on the quotation PDF and in
the emails, on white paper. Pricewright's own screens fix the meaning of some colors: the status
colors (success, warning, danger, information) and the focus ring. Tenants will set their accent in
M7 (pricewright-web's settings screen); the demo tenants need theirs now (brief §2).

Practice:

- **Salesforce** lets an org pick a brand color for its theme, and
  ["in places where your selected brand color isn't accessible, an accessible color is used instead"](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_brandingset.htm);
  overriding that substitution "can make text harder to read" and is not allowed in status
  components.
- **Stripe** applies an account's
  [brand color](https://docs.stripe.com/get-started/account/branding) to emails, the hosted invoice
  page and invoice PDFs, and its accent color as a background in emails: one or two colors, on
  documents Stripe lays out.
- **WCAG 2.2:** text needs 4.5:1 (1.4.3); graphical objects and controls need 3:1 (1.4.11). White
  text on the accent (a button) needs the same 4.5:1 as the accent as text on white.
- **Telling colors apart:** [CSS Color 4](https://www.w3.org/TR/css-color-4/#binsearch) measures
  color differences as ΔEOK, a distance in OKLab, and takes 0.02 as one just-noticeable difference.

## Decision

We will accept a tenant accent only when it meets two rules, and draw an accessible substitute
otherwise:

- **Contrast:** at least 4.5:1 on white, so it reads as text and carries white text.
- **Meaning:** at least 0.08 ΔEOK (four just-noticeable differences) from every reserved color:
  `color.status.{success,warning,danger,info}.text`, `color.action.danger.background` and
  `color.focus.ring`.
- **Fallback:** an accent that fails is darkened in OKLab, hue and chroma kept, until it reaches
  4.5:1; if that shade still fails a rule, the default accent (`color.tenant.accent`, Ledger's
  verdigris, which passes both) is used. The rules and the fallback live in `src/tenant-accent.ts`,
  tested with property tests; pricewright-api implements the same rules when it stores accents (M7).
- **Where it goes:** the tenant's rule in the app's header, on the quotation and in the emails, and
  the tenant's own logo; never a status, never Pricewright's logo (logo guide).
- **Demo tenants** (`tenants/demo-tenants.json`, logos in `docs/brand/tenants/`): Northfield Supply
  in steel `#36597a`, Larkspur Tool Co. in plum `#6b2f74`. Their wordmarks are outlined from fonts
  other than Pricewright's (Archivo, Zilla Slab; SIL OFL), as other companies' would be.

## Alternatives considered

- **Only a contrast check:** a tenant could pick a red that reads as "rejected" on every quote.
- **Refuse a failing accent outright:** simpler, but a tenant with a light brand color could not
  brand at all; Salesforce substitutes instead.
- **A tenant palette (several shades):** more freedom than one accent needs, and every shade would
  need its own contrast pairs.

## Consequences

- **Positive:** any accent a tenant picks yields a color that reads on white and never collides with
  a status; the demo's two tenants look like different companies, not themes of Pricewright.
- **Negative:** a darkened substitute is not the exact brand color, which a tenant may notice; the
  rules exist twice (TypeScript here, Python in the API) and must stay in step.
