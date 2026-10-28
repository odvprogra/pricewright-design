/**
 * The demo tenants (brief §2): Northfield Supply and Larkspur Tool Co., each with one accent and a
 * simple logo. Their wordmarks are outlined from fonts other than Pricewright's, as other companies'
 * would be; `just logo` writes the files to docs/brand/tenants/.
 */
import { readFileSync } from "node:fs";

import opentype from "opentype.js";

import { cssVariable } from "./tokens.ts";

export interface Tenant {
  readonly slug: string;
  readonly name: string;
  /** The tenant's one accent: the logo's color, and `color.tenant.accent` wherever it is shown. */
  readonly accent: string;
  /** The logo's dark parts and wordmark. */
  readonly ink: string;
}

export const TENANTS: readonly Tenant[] = (
  JSON.parse(readFileSync(new URL("../tenants/demo-tenants.json", import.meta.url), "utf8")) as {
    tenants: Tenant[];
  }
).tenants;

/** Colors whose meaning is fixed, which an accent must stay clearly apart from (ADR-0005). */
export const RESERVED_TOKENS: readonly string[] = [
  "color.status.success.text",
  "color.status.warning.text",
  "color.status.danger.text",
  "color.status.info.text",
  "color.action.danger.background",
  "color.focus.ring",
];

/** The reserved colors' values, by token path, from a build's `tokens.json`. */
export function reservedColors(built: Readonly<Record<string, string>>): Record<string, string> {
  return Object.fromEntries(
    RESERVED_TOKENS.map((path) => {
      const value = built[cssVariable(path).slice(2)];
      if (value === undefined) {
        throw new Error(`no token ${path}`);
      }
      return [path, value];
    }),
  );
}

/** Every logo shares Pricewright's grid: 32 units high, the wordmark 7 units right of the mark. */
const HEIGHT = 32;
const GAP = 7;

function parse(file: string): opentype.Font {
  const buffer = readFileSync(new URL(`../assets/fonts/${file}`, import.meta.url));
  return opentype.parse(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  );
}

/**
 * Text outlined glyph by glyph, so capitals can be tracked; kerning still applies between letters.
 * Returns the path and the advance width, tracking after the last letter excluded.
 */
function outline(
  font: opentype.Font,
  text: string,
  x: number,
  baseline: number,
  size: number,
  tracking = 0,
): { d: string; width: number } {
  const scale = size / font.unitsPerEm;
  // One glyph per character: Archivo's contextual substitutions are a lookup opentype.js cannot
  // apply, and these words need none.
  const glyphs = [...text].map((character) => font.charToGlyph(character));
  const parts: string[] = [];
  let cursor = x;
  glyphs.forEach((glyph, index) => {
    parts.push(glyph.getPath(cursor, baseline, size).toPathData(2));
    const next = glyphs[index + 1];
    const kerning = next === undefined ? 0 : font.getKerningValue(glyph, next) * scale;
    cursor += (glyph.advanceWidth ?? 0) * scale + kerning + (next === undefined ? 0 : tracking);
  });
  return { d: parts.join(""), width: cursor - x };
}

function svg(width: number, title: string, body: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${HEIGHT}" width="${width}" ` +
    `height="${HEIGHT}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`
  );
}

interface Drawing {
  /** The mark's shapes on its 32-unit square. */
  readonly mark: (tenant: Tenant) => string;
  /** The wordmark's two lines, outlined from `x`. */
  readonly wordmark: (tenant: Tenant, x: number) => { body: string; width: number };
}

/** A north needle over three furrows of a field, receding to the horizon. */
const NORTHFIELD: Drawing = {
  mark: ({ accent, ink }) =>
    [
      `<path d="M16 2l7.5 15L16 13l-7.5 4z" fill="${accent}"/>`,
      `<path d="M9 21h14M6 25h20M3 29h26" stroke="${ink}" stroke-width="2.2"/>`,
    ].join(""),
  wordmark: ({ ink }, x) => {
    const font = parse("Archivo-SemiBold.ttf");
    const name = outline(font, "NORTHFIELD", x, 17, 16, 0.4);
    const line = outline(font, "SUPPLY", x, 29, 9, 2.25);
    return {
      body: `<path d="${name.d}${line.d}" fill="${ink}"/>`,
      width: Math.max(name.width, line.width),
    };
  },
};

/** A larkspur's flower spike, its stem ending in a tool's handle. */
const LARKSPUR: Drawing = {
  mark: ({ accent, ink }) =>
    [
      `<path d="M16 5v19" stroke="${ink}" stroke-width="1.6"/>`,
      `<rect x="13" y="23.5" width="6" height="6.5" rx="1.6" fill="${ink}"/>`,
      `<g fill="${accent}">`,
      `<circle cx="16" cy="3.5" r="1.5"/><circle cx="13.6" cy="7.4" r="1.9"/>`,
      `<circle cx="18.6" cy="10.6" r="2.2"/><circle cx="13.2" cy="14.4" r="2.5"/>`,
      `<circle cx="19" cy="18.4" r="2.7"/></g>`,
    ].join(""),
  wordmark: ({ ink }, x) => {
    const font = parse("ZillaSlab-SemiBold.ttf");
    const name = outline(font, "Larkspur", x, 19, 19);
    const line = outline(font, "TOOL CO.", x, 29, 8.5, 2.4);
    return {
      body: `<path d="${name.d}${line.d}" fill="${ink}"/>`,
      width: Math.max(name.width, line.width),
    };
  },
};

const DRAWINGS: Readonly<Record<string, Drawing>> = {
  "northfield-supply": NORTHFIELD,
  "larkspur-tool-co": LARKSPUR,
};

function drawing(tenant: Tenant): Drawing {
  const found = DRAWINGS[tenant.slug];
  if (found === undefined) {
    throw new Error(`no drawing for tenant ${tenant.slug}`);
  }
  return found;
}

/** Every tenant's logo and mark, by file name. */
export function tenantLogoFiles(): Record<string, string> {
  const files: Record<string, string> = {};
  for (const tenant of TENANTS) {
    const { mark, wordmark } = drawing(tenant);
    const words = wordmark(tenant, HEIGHT + GAP);
    const width = Math.ceil(HEIGHT + GAP + words.width + 1);
    files[`${tenant.slug}-logo.svg`] = svg(width, tenant.name, mark(tenant) + words.body);
    files[`${tenant.slug}-mark.svg`] = svg(HEIGHT, tenant.name, mark(tenant));
  }
  return files;
}
