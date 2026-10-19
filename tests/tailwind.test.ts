/** theme.css compiled by Tailwind CSS v4 itself, as pricewright-web will compile it. */
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { compile } from "tailwindcss";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { SHADCN_ALIASES, build } from "../src/tokens.ts";

const require = createRequire(import.meta.url);
const TAILWIND = join(dirname(require.resolve("tailwindcss/package.json")), "index.css");

let out: string;

async function generate(candidates: string[]): Promise<string> {
  const compiler = await compile('@import "tailwindcss";\n@import "./theme.css";\n', {
    base: out,
    loadStylesheet: async (id: string, base: string) => {
      const path = id === "tailwindcss" ? TAILWIND : resolve(base, id);
      return { path, base: dirname(path), content: await readFile(path, "utf8") };
    },
  });
  return compiler.build(candidates);
}

beforeAll(async () => {
  out = await mkdtemp(join(tmpdir(), "pricewright-tailwind-"));
  await build(out);
});

afterAll(async () => {
  await rm(out, { recursive: true, force: true });
});

describe("theme.css in Tailwind CSS v4", () => {
  it("generates utilities from the semantic tokens", async () => {
    const css = await generate([
      "bg-surface-muted",
      "text-text-default",
      "border-border-input",
      "rounded-sm",
      "shadow-md",
      "font-heading",
      "text-sm",
      "leading-snug",
      "ease-standard",
      "p-4",
    ]);

    expect(css).toContain("--color-surface-muted: #f5f6f8;");
    expect(css).toMatch(/\.bg-surface-muted\s*\{\s*background-color: var\(--color-surface-muted\)/);
    expect(css).toMatch(/\.rounded-sm\s*\{\s*border-radius: var\(--radius-sm\)/);
    expect(css).toMatch(/\.font-heading\s*\{\s*font-family: var\(--font-heading\)/);
    expect(css).toMatch(/\.p-4\s*\{\s*padding: calc\(var\(--spacing\) \* 4\)/);
    expect(css).toContain("--spacing: 0.25rem;");
  });

  it("serves shadcn/ui's class names from the aliases", async () => {
    const names = Object.keys(SHADCN_ALIASES);
    const css = await generate(names.map((name) => `bg-${name}`));

    for (const name of names) {
      expect(css).toContain(`.bg-${name}`);
    }
    expect(css).toMatch(
      /\.bg-primary\s*\{\s*background-color: var\(--color-action-primary-background\)/,
    );
  });

  it("generates nothing from Tailwind's defaults or the palette", async () => {
    const css = await generate([
      "bg-red-500",
      "text-blue-600",
      "bg-palette-navy-700",
      "rounded-lg",
      "shadow-xl",
      "text-base",
      "ease-in-out",
    ]);

    expect(css).not.toMatch(
      /\.(bg-red-500|text-blue-600|bg-palette-navy-700|rounded-lg|shadow-xl|text-base|ease-in-out)\b/,
    );
  });
});
