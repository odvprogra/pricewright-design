# Clickable prototype

The key screens of `pricewright-web`'s first release, built on the design tokens for the first
usability test ([plan](../docs/ux/usability-test-1/plan.md)): sign in, quotes, the quote builder,
quote detail, the approval inbox (desktop and phone) and customers, as the
[screen specs](../docs/ux/screens/README.md) describe them.

Published with the brand guide: <https://odvprogra.github.io/pricewright-design/prototype/>.

It is a throwaway on purpose: plain HTML, CSS and JavaScript modules, no framework, so it can change
between sessions in minutes. `pricewright-web` implements the specs, not this code.

## Data: the real demo and the real engine

`data/demo.json` is Northfield Supply's demo as `pricewright-api` seeds it (seed 2026, as of
2026-10-19): customers, the catalog, the pricing rules' effect and 161 quotes. Every product carries
its price for each customer tier and volume bracket, computed by the API's pricing engine, so a line
priced here is the line the API would price. The prototype only repeats the arithmetic after the
engine (line totals, tax, the approval check) in exact integers, and
`tests/prototype-pricing.test.ts` checks it against 2,020 quotes the engine priced
(`tests/fixtures/engine-prices.json`), task 2's quote among them.

Regenerate both from a `pricewright-api` checkout next to this repository:

```sh
just demo-data            # or: just demo-data ../path/to/pricewright-api
```

`data/demo.json` records the API version it came from in `source`.

## Accounts and links

- Sign in as `taylor@northfield.example` (sales rep) or `morgan@northfield.example` (sales manager),
  with any password.
- What a participant does stays in that browser tab (`sessionStorage`).
- Moderator links, pasted in the chat during a session:
  - `…/prototype/?reset`: the demo as exported, signed out (before each session).
  - `…/prototype/#/moderator/approve-latest`: Morgan approves the quote the participant submitted
    (before task 5).

## Checks

- `just e2e`: the usability test's five tasks in Chromium, on a desktop and a phone, with axe (WCAG
  2.2 AA tags) on every screen they pass through and no horizontal scroll on the phone.
- `just site && just serve`: the prototype at <http://localhost:8123/prototype/>.
