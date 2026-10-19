/**
 * The Pricewright logo (ADR-0003): a ruled ledger sheet closed by the accountant's double rule, and
 * the wordmark in Source Serif 4 Subhead Semibold, outlined so no font is needed to show it.
 * Every color comes from the tokens; `just logo` writes the SVG files to docs/brand/logo/.
 */
import { readFileSync } from "node:fs";

import opentype from "opentype.js";

export interface LogoColors {
  /** The sheet, its rules and the wordmark. */
  readonly ink: string;
  /** The double rule. */
  readonly accent: string;
  /** The folded corner of the small mark. */
  readonly fold: string;
}

/** The mark's grid: 32 units; the double rule's lower line is the wordmark's baseline. */
const MARK = 32;
const BASELINE = 25;
const WORDMARK_SIZE = 25;
const GAP = 7;
const WORDMARK = "Pricewright";

const FONT = new URL("../assets/fonts/SourceSerif4Subhead-Semibold.ttf", import.meta.url);

function markShapes(colors: LogoColors): string {
  return [
    `<path d="M7 4h13l6 6v18H7z" fill="none" stroke="${colors.ink}" stroke-width="2.2" stroke-linejoin="miter"/>`,
    `<path d="M20 4v6h6" fill="none" stroke="${colors.ink}" stroke-width="2.2" stroke-linejoin="miter"/>`,
    `<path d="M11 14.5h11M11 18.5h11" stroke="${colors.ink}" stroke-width="1.8"/>`,
    `<path d="M15 22.6h7M15 ${BASELINE}h7" stroke="${colors.accent}" stroke-width="1.6"/>`,
  ].join("");
}

function svg(width: number, height: number, title: string, body: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" ` +
    `height="${height}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`
  );
}

/** The mark alone, from 24 px up. */
export function mark(colors: LogoColors): string {
  return svg(MARK, MARK, "Pricewright", markShapes(colors));
}

/**
 * The mark below 24 px (favicons, tabs): a solid sheet with its fold and the double rule cut out, as
 * the outlined mark's thin rules blur at that size.
 */
export function smallMark(colors: LogoColors, paper: string): string {
  return svg(
    16,
    16,
    "Pricewright",
    [
      `<path d="M2.5 1.5H10l3.5 3.5v9.5h-11z" fill="${colors.ink}"/>`,
      `<path d="M10 1.5V5h3.5z" fill="${colors.fold}"/>`,
      `<path d="M5.5 9.6h5.5M5.5 12h5.5" stroke="${paper}" stroke-width="1.2"/>`,
    ].join(""),
  );
}

/** The wordmark's outline, starting at `x`, sitting on the mark's baseline. */
export function wordmarkPath(x: number): { d: string; width: number } {
  const buffer = readFileSync(FONT);
  const font = opentype.parse(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  );
  const options = { kerning: true };
  const path = font.getPath(WORDMARK, x, BASELINE, WORDMARK_SIZE, options);
  return { d: path.toPathData(2), width: font.getAdvanceWidth(WORDMARK, WORDMARK_SIZE, options) };
}

/** The mark and the wordmark side by side: the primary logo. */
export function lockup(colors: LogoColors): string {
  const start = MARK + GAP;
  const wordmark = wordmarkPath(start);
  const width = Math.ceil(start + wordmark.width + 1);
  return svg(
    width,
    MARK,
    "Pricewright",
    `${markShapes(colors)}<path d="${wordmark.d}" fill="${colors.ink}"/>`,
  );
}
