import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { CONTRAST_PAIRS, isTextToken } from "../src/contrast-pairs.ts";
import { contrastRatio } from "../src/contrast.ts";
import { SHADCN_ALIASES, build, cssColor, cssVariable, tailwindVariable } from "../src/tokens.ts";

let out: string;
let built: Record<string, string>;
let tokensCss: string;
let themeCss: string;
let sourcePaths: string[];

/** The dotted path of every token (a group member with a `$value`) in a DTCG document. */
function tokenPaths(node: unknown, prefix: string[] = []): string[] {
  if (typeof node !== "object" || node === null) {
    return [];
  }
  if ("$value" in node) {
    return [prefix.join(".")];
  }
  return Object.entries(node)
    .filter(([key]) => !key.startsWith("$"))
    .flatMap(([key, child]) => tokenPaths(child, [...prefix, key]));
}

const value = (path: string): string => {
  const found = built[cssVariable(path).slice(2)];
  if (found === undefined) {
    throw new Error(`no token ${path}`);
  }
  return found;
};

beforeAll(async () => {
  out = await mkdtemp(join(tmpdir(), "pricewright-tokens-"));
  await build(out);
  built = JSON.parse(await readFile(join(out, "tokens.json"), "utf8")) as Record<string, string>;
  tokensCss = await readFile(join(out, "tokens.css"), "utf8");
  themeCss = await readFile(join(out, "theme.css"), "utf8");
  const files = (await readdir("tokens")).filter((name) => name.endsWith(".tokens.json"));
  const documents = await Promise.all(files.map((name) => readFile(join("tokens", name), "utf8")));
  sourcePaths = documents.flatMap((text) => tokenPaths(JSON.parse(text)));
});

afterAll(async () => {
  await rm(out, { recursive: true, force: true });
});

describe("contrast", () => {
  it.each(CONTRAST_PAIRS.map((pair) => [pair.foreground, pair.background, pair.minimum] as const))(
    "%s on %s reaches %s:1",
    (foreground, background, minimum) => {
      expect(contrastRatio(value(foreground), value(background))).toBeGreaterThanOrEqual(minimum);
    },
  );

  it("checks every text token against at least one background", () => {
    const checked = new Set(CONTRAST_PAIRS.map((pair) => pair.foreground));
    const textTokens = sourcePaths.filter(isTextToken);

    expect(textTokens.length).toBeGreaterThan(0);
    expect(textTokens.filter((path) => !checked.has(path))).toEqual([]);
  });

  it("names only tokens that exist", () => {
    const known = new Set(sourcePaths);
    const named = CONTRAST_PAIRS.flatMap((pair) => [pair.foreground, pair.background]);

    expect(named.filter((path) => !known.has(path))).toEqual([]);
  });
});

describe("tailwindVariable", () => {
  it.each([
    ["color.surface.muted", "--color-surface-muted"],
    ["font.family.heading", "--font-heading"],
    ["font.weight.semibold", "--font-weight-semibold"],
    ["font.size.sm", "--text-sm"],
    ["font.leading.snug", "--leading-snug"],
    ["radius.sm", "--radius-sm"],
    ["shadow.md", "--shadow-md"],
    ["motion.ease.standard", "--ease-standard"],
    ["space.unit", "--spacing"],
  ])("puts %s in Tailwind's %s", (path, variable) => {
    expect(tailwindVariable(path.split("."))).toBe(variable);
  });

  it.each(["space.4", "border-width.focus", "motion.duration.fast", "font.family"])(
    "leaves %s out of the theme",
    (path) => {
      expect(tailwindVariable(path.split("."))).toBeUndefined();
    },
  );
});

describe("cssColor", () => {
  it("writes opaque sRGB as hex and translucent sRGB as rgba()", () => {
    expect(cssColor({ colorSpace: "srgb", components: [0.1059, 0.1333, 0.2] })).toBe("#1b2233");
    expect(cssColor({ colorSpace: "srgb", components: [0.1059, 0.1333, 0.2], alpha: 0.08 })).toBe(
      "rgba(27, 34, 51, 0.08)",
    );
  });

  it("refuses other color spaces", () => {
    expect(() => cssColor({ colorSpace: "oklch", components: [0.5, 0.1, 250] })).toThrow(
      "only sRGB colors are supported",
    );
  });
});

describe("tokens.json", () => {
  it("holds every source token", () => {
    expect(Object.keys(built).sort()).toEqual(
      sourcePaths.map((p) => cssVariable(p).slice(2)).sort(),
    );
  });
});

describe("tokens.css", () => {
  it("declares every token on :root with a resolved value", () => {
    expect(tokensCss).toContain(":root {");
    expect(tokensCss).toContain("--color-text-default: #1b2233;");
    expect(tokensCss).not.toContain("var(");
  });
});

describe("theme.css", () => {
  it("resets Tailwind's palette and exposes semantic colors only", () => {
    expect(themeCss).toContain("--color-*: initial;");
    expect(themeCss).toContain("--color-surface-muted: #f5f6f8;");
    expect(themeCss).not.toMatch(/--palette-/);
  });

  it("maps every shadcn/ui name to a semantic token that exists", () => {
    const known = new Set(sourcePaths);
    for (const [name, path] of Object.entries(SHADCN_ALIASES)) {
      expect(themeCss).toContain(`--color-${name}: var(${cssVariable(path)});`);
      expect(known.has(path)).toBe(true);
    }
  });
});
