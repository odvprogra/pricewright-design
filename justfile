# Uniform commands (HANDBOOK §3). Requires: Node.js 24 (with Corepack), Docker and pre-commit.

set windows-shell := ["powershell.exe", "-NoLogo", "-NoProfile", "-Command"]

pnpm := "corepack pnpm"
actionlint := "rhysd/actionlint:1.7.12@sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667"

# List the recipes
default:
    @just --list

# Install the locked dependencies and the git hooks
setup:
    {{ pnpm }} install --frozen-lockfile
    pre-commit install

# Lint workflows, formatting and Markdown
lint:
    docker run --rm -v "{{ justfile_directory() }}:/repo" -w /repo {{ actionlint }}
    {{ pnpm }} exec prettier --check .
    {{ pnpm }} exec markdownlint-cli2

# Format every supported file
fmt:
    {{ pnpm }} exec prettier --write .

# Build every token format into dist/ (tokens.css, theme.css, tokens.json)
build:
    node scripts/build.ts

# Build the brand guide into dist/site/, as GitHub Pages publishes it
site:
    node scripts/site.ts

# Serve dist/site/ on http://localhost:8123 (run `just site` first)
serve:
    node scripts/serve.ts

# The prototype's journeys in Chromium, desktop and phone, with axe (needs `playwright install chromium`)
e2e:
    {{ pnpm }} exec playwright test

# Export Northfield's demo and the engine's prices from a pricewright-api checkout next to this one
demo-data api="../pricewright-api":
    uv run --frozen --project {{ api }} python prototype/tools/export_demo.py {{ api }}

# Draw the logo files into docs/brand/logo/ from the tokens and the outlined wordmark
logo:
    node scripts/logo.ts

# Type-check the build and the tests
typecheck:
    {{ pnpm }} exec tsc --noEmit -p .

# Run the tests: contrast of every token pair, the builds' contents
test:
    {{ pnpm }} exec vitest run

# Everything CI checks
check: lint typecheck test
