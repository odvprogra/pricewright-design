# 0002. A design repository of its own, consumed through pinned releases

- **Status:** Accepted
- **Date:** 2026-10-19

## Context

Pricewright's brand and design tokens have three consumers, in three repositories and two languages:
`pricewright-web` (Next.js, from M7), `pricewright-api` (the quote PDF and the emails, rendered by
Python) and `ops-copilot` (an HTMX review screen). The handbook (§14.1) asked for the tokens "in the
pricewright repo", written before Pricewright was split into an API and a web repository with a
versioned contract between them (D-20).

How design systems with several consumers publish their tokens:

- **GitHub Primer** keeps them in a repository of their own,
  [primer/primitives](https://github.com/primer/primitives): sources in `src/tokens`, built by Style
  Dictionary into CSS variables, published as a versioned package that every Primer implementation
  consumes.
- **Shopify Polaris** keeps `polaris-tokens` as a package inside its monorepo, next to the React
  components that are its main consumer ([Shopify/polaris](https://github.com/Shopify/polaris)).
- **Tailwind CSS v4** shares a theme as a CSS file with `@theme` that each project imports, "in
  their own package in monorepo setups or even publish them to NPM"
  ([Tailwind docs](https://tailwindcss.com/docs/theme)).

How they version changes:

- Removing or renaming a token breaks consumers (`var()` stops resolving): a major version. Adobe's
  [Spectrum design data](https://opensource.adobe.com/spectrum-design-data/spec/evolution) keeps a
  deprecated token for at least two minor versions before it goes, unless a major version removes
  it.
- Adding a token is a minor version. A changed value changes how consumers look but breaks no build;
  it is released as a minor version
  ([Plain Concepts' release policy](https://platform.plainconcepts.com/docs/releases)).

## Decision

- We will keep the brand guide, the design tokens, the UX research and the prototype in this
  repository, `pricewright-design`.
- Every release attaches the token builds as assets (CSS custom properties, the Tailwind CSS theme,
  JSON) to an immutable GitHub release, the way `pricewright-api` attaches `openapi.json`. Each
  consumer pins a release and updates by moving the pin in a reviewed pull request; none reads
  `main`.
- Versions follow SemVer for consumers:
  - **Major:** a token removed or renamed, or a build's format changed. A token is marked
    `$deprecated` (DTCG) in a minor version before a major one removes it.
  - **Minor:** a token added or deprecated, or a value changed. Contrast tests gate every value
    change.
  - **Patch:** fixes to the builds or the documentation that leave every token's name and value as
    it was.
- The brand guide and the prototype are published on GitHub Pages from `main`.

## Alternatives considered

- **Inside `pricewright-web`:** close to the main consumer, like Polaris. But the API and
  `ops-copilot` would pin assets of an application that is itself one of the API's consumers,
  turning D-20's direction of dependency around, and the tokens would release with the app.
- **Inside `pricewright-api`:** the API owns the PDFs and emails, but not the brand; a Python
  service would carry Node tooling for the tokens, and the web app would depend on the API's
  repository for its look.
- **A package on npm:** what Primer and Polaris do. It suits many consumers that install with a
  package manager; here one consumer is Python and another pins a copy, and a release asset needs no
  registry or publishing token. It can be added later without changing the builds.

## Consequences

- **Positive:** one owner for every value; each consumer moves at its own pace, and a design change
  is visible as a version bump in each repository.
- **Negative:** a change that spans the tokens and a consumer takes two pull requests, a release
  here and a bump there; this repository needs its own CI and release workflow before
  `pricewright-web` exists.
