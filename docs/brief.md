# Brief — pricewright-design

> Milestone M12 of Pricewright (UX and brand). The product brief lives in
> [pricewright-api's docs/brief.md](https://github.com/odvprogra/pricewright-api/blob/main/docs/brief.md);
> the UI and UX standards are
> [§14 of the engineering handbook](https://github.com/odvprogra/engineering-standards/blob/v1/HANDBOOK.md#14-ui--ux-standards).

## 1. Problem

Pricewright is presented as a real product, so every surface a user touches must read as one product
family: the web app (`pricewright-web`), the quote PDFs and emails (`pricewright-api`) and the
review UI of `ops-copilot`. Usability has to be designed and measured before the web app is built,
not assumed after.

## 2. What this repository holds

| Deliverable                     | What it is                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| Brand guide (`docs/brand/`)     | Name and positioning, logo, color palette with a contrast table, typography, iconography, voice   |
| Design tokens (`tokens/`)       | Color, typography, spacing, radius, shadow and motion; semantic names; the only source of truth   |
| Token builds (release assets)   | CSS custom properties, a Tailwind CSS theme and JSON, attached to each immutable release          |
| Journeys and specs (`docs/ux/`) | Journeys per role and one spec per screen: purpose, data, actions, the four states, permissions   |
| Prototype (`prototype/`)        | Hi-fi clickable pages of the key screens, built on the tokens, with Northfield's demo data        |
| Usability test (`docs/ux/`)     | Plan, script and results with five participants: task success, time, errors, SEQ and SUS; changes |
| Demo tenants                    | Simple logos and one accent color for Northfield Supply and Larkspur Tool Co.                     |

## 3. Consumers

- `pricewright-web` (M7) imports the CSS and the Tailwind theme of a pinned release and implements
  the screen specs with shadcn/ui.
- `pricewright-api` sets the quote PDF's and the emails' CSS custom properties from a pinned release
  (ADR-0027 and ADR-0028 there).
- `ops-copilot` pins a copy for its review UI.

## 4. Acceptance criteria

- Every token pair used for text reaches 4.5:1 and every UI component and focus pair 3:1 (WCAG 2.2
  AA), checked by a test that fails CI.
- A tagged release attaches the token builds, and `pricewright-api` renders its PDF and emails with
  them.
- Usability test: at least 4 of 5 participants complete "build a 5-line quote and submit it" without
  help; the SUS score and the changes the test caused are reported.

## 5. Out of scope

- Components and Storybook: `pricewright-web` (M7), published in M8.
- Dark mode: the tokens are structured so it is additive (stretch).
- Storing a tenant's logo and accent color: `pricewright-api` with the settings screen (M7).
- Every company in this universe (Pricewright, Northfield Supply, Larkspur Tool Co.) is fictional.
