/**
 * The rules a tenant's accent must meet (ADR-0005), and the accessible shade used when it does not,
 * as Salesforce's branding sets substitute one. Color differences are OKLab distances (ΔEOK).
 */
import { TEXT_MINIMUM, contrastRatio, relativeLuminance } from "./contrast.ts";

/** CSS Color 4's just-noticeable difference in OKLab. */
export const JND = 0.02;

/** How far an accent stays from every reserved color: four just-noticeable differences. */
export const MINIMUM_DISTANCE = 4 * JND;

/** Where accents sit: white paper (the PDF, the emails, the app's cards). */
export const PAPER = "#ffffff";

type Oklab = readonly [number, number, number];

function linear(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function encoded(value: number): number {
  const c = Math.min(Math.max(value, 0), 1);
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(v * 255);
}

/** sRGB `#rrggbb` to OKLab (Björn Ottosson's matrices, as CSS Color 4 uses them). */
export function oklab(hex: string): Oklab {
  relativeLuminance(hex); // validates the format
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(linear) as [
    number,
    number,
    number,
  ];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** OKLab back to sRGB, clipped to the gamut. */
export function hexFromOklab([L, a, b]: Oklab): string {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return `#${rgb.map((c) => encoded(c).toString(16).padStart(2, "0")).join("")}`;
}

/** ΔEOK: the Euclidean distance between two colors in OKLab. */
export function distance(first: string, second: string): number {
  const [a, b] = [oklab(first), oklab(second)];
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export interface AccentCheck {
  readonly contrast: number;
  /** The reserved color nearest to the accent, and how far it is. */
  readonly nearest: { readonly name: string; readonly distance: number };
  readonly problems: readonly string[];
}

/**
 * An accent must read as text on white and carry white text (4.5:1 both ways, the same ratio), and
 * stay clearly apart from the colors whose meaning is fixed: status and focus.
 */
export function checkAccent(
  accent: string,
  reserved: Readonly<Record<string, string>>,
): AccentCheck {
  const contrast = contrastRatio(accent, PAPER);
  const distances = Object.entries(reserved).map(([name, color]) => ({
    name,
    distance: distance(accent, color),
  }));
  if (distances.length === 0) {
    throw new Error("no reserved colors to check against");
  }
  const nearest = distances.reduce((a, b) => (b.distance < a.distance ? b : a));
  const problems: string[] = [];
  if (contrast < TEXT_MINIMUM) {
    problems.push(`contrast ${contrast.toFixed(2)}:1 on white, below ${TEXT_MINIMUM}:1`);
  }
  for (const { name, distance: d } of distances.filter((x) => x.distance < MINIMUM_DISTANCE)) {
    problems.push(`ΔEOK ${d.toFixed(3)} from ${name}, below ${MINIMUM_DISTANCE.toFixed(2)}`);
  }
  return { contrast, nearest, problems };
}

/**
 * The accent to draw: the tenant's own when it passes; otherwise the same hue darkened in OKLab
 * until it reaches 4.5:1, if that shade passes; otherwise the default accent.
 */
export function accessibleAccent(
  accent: string,
  reserved: Readonly<Record<string, string>>,
  fallback: string,
): string {
  if (checkAccent(accent, reserved).problems.length === 0) {
    return accent;
  }
  const [L, a, b] = oklab(accent);
  for (let lightness = L; lightness > 0; lightness -= 0.005) {
    const shade = hexFromOklab([lightness, a, b]);
    if (contrastRatio(shade, PAPER) >= TEXT_MINIMUM) {
      return checkAccent(shade, reserved).problems.length === 0 ? shade : fallback;
    }
  }
  return fallback;
}
