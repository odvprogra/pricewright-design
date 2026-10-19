# 0004. DTCG tokens, in two tiers, built by Style Dictionary

- **Status:** Accepted
- **Date:** 2026-10-19

## Context

The tokens are the only place a value is defined (ADR-0001), and three consumers read them in
different forms: CSS custom properties (the PDF and emails, `ops-copilot`), a Tailwind CSS v4 theme
with shadcn/ui's variable names (`pricewright-web`), and plain data.

- **Format:** the Design Tokens Community Group's Format Module reached its first stable version,
  2025.10, on 28 October 2025
  ([W3C Community Group report](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/)).
  A color's `$value` is an object (`colorSpace`, `components`, an optional `hex`), and dimensions
  are `{ value, unit }`.
- **Build:** [Style Dictionary](https://styledictionary.com) reads DTCG natively since version 4;
  its 5.3 release made every color transform accept the object form. GitHub's
  [Primer primitives](https://github.com/primer/primitives) build their CSS variables with it.
- **Tiers:** Nathan Curtis's naming model and most systems since separate primitive values from
  semantic tokens that name an intent; components use the semantic ones, and component-level tokens
  are only worth it once there are themes
  ([Naming Tokens in Design Systems](https://nathanacurtis.substack.com/p/naming-tokens-in-design-systems-9e86c7444676)).
  The handbook asks for exactly that: `--color-danger`, never a raw palette value (§14.1).
- **Tailwind CSS v4** turns every `--color-*` theme variable into utilities and shares a theme as a
  CSS file with `@theme` ([docs](https://tailwindcss.com/docs/theme)); a JavaScript configuration,
  where v3's presets lived, is only loaded through the legacy `@config` directive.
- **shadcn/ui** themes its components through fixed names (`--background`, `--primary`, `--muted`,
  `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`, …), mapped into Tailwind
  with `@theme inline`. Its `accent` is the hover, focus and selected surface of menus and rows, not
  a brand color ([theming](https://ui.shadcn.com/docs/theming)).

## Decision

- **Source:** DTCG 2025.10 JSON in `tokens/`, one file per tier and category, `*.tokens.json`.
  Colors are written in sRGB with their `hex`.
- **Two tiers:**
  - `palette.*`: primitive values (navy, verdigris, neutral, red, amber, green, blue scales).
    Nothing outside `tokens/` may use them.
  - Semantic tokens by intent: `color.text.*`, `color.surface.*`, `color.border.*`,
    `color.action.*`, `color.accent.*`, `color.status.*`, `color.focus.*`, then type, space, radius,
    shadow and motion. They reference palette tokens.
  - No component tier until a theme (dark, high contrast) needs one.
- **Builds** (Style Dictionary, `just build` into `dist/`):
  - `tokens.css`: every token as a custom property on `:root`, names from the token path
    (`color.surface.muted` → `--color-surface-muted`), with resolved values rather than `var()`
    chains, so a consumer can copy a value where custom properties do not work (email clients).
  - `theme.css`: a Tailwind CSS v4 `@theme`. Token names follow Tailwind's namespaces
    (`font.size.sm` → `--text-sm`, `space.unit` → `--spacing`). Tailwind's defaults are reset in
    every namespace it replaces (color, radius, shadow, text, leading, ease), and only semantic
    tokens are registered, so neither a Tailwind default nor a palette color can become a utility.
    shadcn/ui's names follow as aliases of semantic tokens: `--color-primary` is the primary action,
    `--color-accent` the hover surface, not the brand accent.
  - `tokens.json`: every token's resolved value, flat, for consumers that are not CSS.
- **Contrast is a test:** every pair a screen can draw (text on its surfaces, controls and focus on
  their backgrounds) is listed with its minimum, 4.5:1 for text and 3:1 for UI components and focus
  (WCAG 2.2 AA), and the test suite fails below it; every text token must appear in a pair.
- **The tenant accent** is one semantic token, `color.tenant.accent`, defaulting to the brand
  accent; consumers override it at runtime and never anything else (handbook §14.1).

## Alternatives considered

- **Hand-written CSS variables:** no build, but no second format either; the Tailwind theme, the
  shadcn aliases and the JSON would be copies kept in sync by hand.
- **Tokens Studio or Terrazzo:** Tokens Studio is a Figma plugin (no Figma here, D-15); Terrazzo
  also reads DTCG, but Style Dictionary is the more widely used build and the one Primer relies on.
- **Three tiers from the start:** component tokens for every shadcn component, before any theme
  exists, would add names nothing varies.

## Consequences

- **Positive:** one source, three formats; a value change is one diff, tested for contrast before it
  ships; the Tailwind theme cannot expose a raw palette color.
- **Negative:** sRGB components are verbose to write by hand (each color also carries its `hex`);
  the build depends on Style Dictionary's DTCG support keeping up with the format.
