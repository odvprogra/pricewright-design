/** Every logo file, by name, colored from the built tokens. */
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { type LogoColors, lockup, mark, smallMark } from "./logo.ts";
import { build } from "./tokens.ts";

async function builtTokens(): Promise<Record<string, string>> {
  const out = await mkdtemp(join(tmpdir(), "pricewright-logo-"));
  try {
    await build(out);
    const json = JSON.parse(await readFile(join(out, "tokens.json"), "utf8")) as {
      tokens: Record<string, string>;
    };
    return json.tokens;
  } finally {
    await rm(out, { recursive: true, force: true });
  }
}

export async function logoFiles(): Promise<Record<string, string>> {
  const tokens = await builtTokens();
  const color = (name: string): string => {
    const value = tokens[`color-${name}`];
    if (value === undefined) {
      throw new Error(`no token color-${name}`);
    }
    return value;
  };
  const light: LogoColors = {
    ink: color("logo-ink"),
    accent: color("logo-rule"),
    fold: color("logo-fold"),
  };
  const inverse: LogoColors = {
    ink: color("logo-ink-inverse"),
    accent: color("logo-rule-inverse"),
    fold: color("logo-fold-inverse"),
  };
  return {
    "pricewright-logo.svg": lockup(light),
    "pricewright-logo-inverse.svg": lockup(inverse),
    "pricewright-mark.svg": mark(light),
    "pricewright-mark-inverse.svg": mark(inverse),
    "pricewright-mark-small.svg": smallMark(light, color("surface-default")),
  };
}
