/** WCAG 2.2 contrast between sRGB colors written as `#rrggbb` (success criteria 1.4.3 and 1.4.11). */

const HEX = /^#[0-9a-f]{6}$/i;

/** Text and images of text: 4.5:1 (1.4.3). */
export const TEXT_MINIMUM = 4.5;

/** User interface components and focus indicators: 3:1 (1.4.11). */
export const UI_MINIMUM = 3;

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance, from 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  if (!HEX.test(hex)) {
    throw new Error(`expected a #rrggbb color, got ${JSON.stringify(hex)}`);
  }
  const n = Number.parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
}

/** Contrast ratio from 1 (none) to 21 (black on white); the order of the colors does not matter. */
export function contrastRatio(a: string, b: string): number {
  const [first, second] = [relativeLuminance(a), relativeLuminance(b)];
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
