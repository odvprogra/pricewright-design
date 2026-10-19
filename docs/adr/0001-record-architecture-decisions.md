# 0001. Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-10-19

## Context

Pricewright's design work needs a record of why its decisions were made, next to the files they
shape, and a way of working that keeps the brand, the tokens and the shipped products from drifting
apart.

The shared engineering standards already define how decisions are recorded:
[ADR-0001 in engineering-standards](https://github.com/odvprogra/engineering-standards/blob/v1/docs/adr/0001-record-architecture-decisions.md).
They also decide that design is done without Figma and that code is the source of truth (handbook
§14.1, §14.5).

## Decision

- We will record decisions specific to this repository as ADRs in `docs/adr/`, starting from
  [the template](template.md). Shared decisions are not repeated here; they are linked.
- We will treat design as code: the design tokens in this repository are the only place a color, a
  size or a font is defined. The brand guide, the prototype and every consumer read them; nothing is
  drawn first and transcribed later.
- We will write the brand guide, the screen specs and the prototype as plain HTML and Markdown that
  render in a browser and review in a pull request.

## Alternatives considered

- **A design tool (Figma) as the source of truth:** the canvas becomes the reference and code copies
  it, so the two drift; writing to it from automation needs a paid seat. Rejected in the shared
  standards (D-15).
- **Docs only, no tokens here:** each consumer would hold its own copy of the values, which is the
  drift this repository exists to prevent.

## Consequences

- **Positive:** a design change is a reviewed diff with a version; consumers update by moving a pin.
- **Negative:** there is no visual canvas to sketch on; explorations are HTML pages, and a decision
  made without an ADR is documentation debt.
