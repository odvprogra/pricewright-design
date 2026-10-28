# Demo tenants

Pricewright's two fictional demo tenants, each with one accent and a simple logo
([ADR-0005](../adr/0005-tenant-accents-checked-with-an-accessible-fallback.md)). Their data is in
[`tenants/demo-tenants.json`](../../tenants/demo-tenants.json); `just logo` draws the files below,
and a test fails if a committed file differs. The brand guide's
[tenants page](https://odvprogra.github.io/pricewright-design/tenants.html) shows the checks.

| Tenant            | Logo                                                     | Accent    | On white | Mark                                                        |
| ----------------- | -------------------------------------------------------- | --------- | -------- | ----------------------------------------------------------- |
| Northfield Supply | ![Northfield Supply](tenants/northfield-supply-logo.svg) | `#36597a` | 7.33:1   | A north needle over three furrows of a field                |
| Larkspur Tool Co. | ![Larkspur Tool Co.](tenants/larkspur-tool-co-logo.svg)  | `#6b2f74` | 9.19:1   | A larkspur's flower spike, its stem ending in a tool handle |

## The accent's rules

- At least 4.5:1 on white: it reads as text and carries white text.
- At least 0.08 ΔEOK (four just-noticeable differences) from the status colors, the danger action
  and the focus ring: it never reads as success, warning, danger, information or focus.
- A failing accent is darkened in OKLab until it reaches 4.5:1; if that shade still fails, the
  default `color.tenant.accent` is used.
- It colors the tenant's rule in the app's header, on the quotation and in the emails, and the
  tenant's logo. Never a status, and never Pricewright's logo.

## Construction

- Both logos share Pricewright's grid: a 32-unit mark and a two-line wordmark 7 units to its right.
- Northfield's wordmark is Archivo SemiBold in capitals, "SUPPLY" tracked; Larkspur's is Zilla Slab
  SemiBold, "TOOL CO." tracked. Both fonts are under the SIL Open Font License (`assets/fonts/`).
- Each logo uses two colors only: the tenant's accent and its ink (`#1c2833`, `#2b2230`).
