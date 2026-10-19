# CLAUDE.md — pricewright-design

> Context for AI coding assistants. Keep it short; it points to the standards instead of repeating
> them.

## What this repo is

Pricewright's brand, design tokens and UX research (milestone M12): the brand guide, the tokens and
their builds, journeys and screen specs, the clickable prototype and the usability test.
`pricewright-web`, `pricewright-api` (PDFs and emails) and `ops-copilot` consume the token builds of
a pinned release. All companies in its universe (Pricewright, Northfield Supply, Larkspur Tool Co.)
are fictional.

## Language

- Talk to the maintainer in Spanish.
- Everything committed to this repo is in English (code, comments, docs, commits, PRs).

## Rules you must follow

- Engineering standards are mandatory, §14 (UI and UX) above all:
  [HANDBOOK.md](https://github.com/odvprogra/engineering-standards/blob/v1/HANDBOOK.md)
- Brief: [docs/brief.md](docs/brief.md).
- Tokens are the only place a value is defined (ADR-0001); components use semantic tokens, never raw
  palette values.
- Design decisions follow researched industry practice, with sources in the ADR.
- Usability results are only ever what participants actually did; nothing is estimated or invented.
- No employer code, data, names or domains — ever.
- No new dependencies without justification. No secrets in the repo.
- One branch and one PR per increment, PR template filled in, CI green, squash merge.

## Commands

```text
just setup | just check | just lint | just typecheck | just test | just fmt
just build                                      # dist/: tokens.css, theme.css, tokens.json
```

`just check` must pass before a task is considered done.

## Decisions already made

See `docs/adr/`. Do not contradict an accepted ADR; propose a new ADR that supersedes it instead.

## Current status

- In progress: M12. Done: decisions ADR-0001–0004, journeys and screen specs, the usability test
  plan, positioning and voice, every token (color, type, space, radius, shadow, motion). Next: the
  release workflow; the logo; the brand guide pages; the prototype; the test sessions.
