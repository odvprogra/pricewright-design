/**
 * Every foreground a screen may draw on each background it may sit on, with its WCAG minimum.
 * The tests check each pair; the brand guide prints the same list as its contrast table.
 */
import { TEXT_MINIMUM, UI_MINIMUM } from "./contrast.ts";

export interface ContrastPair {
  /** Token path of the foreground, as in the source (`color.text.default`). */
  readonly foreground: string;
  readonly background: string;
  readonly minimum: number;
}

const text = (foreground: string, ...backgrounds: string[]): ContrastPair[] =>
  backgrounds.map((background) => ({ foreground, background, minimum: TEXT_MINIMUM }));

const ui = (foreground: string, ...backgrounds: string[]): ContrastPair[] =>
  backgrounds.map((background) => ({ foreground, background, minimum: UI_MINIMUM }));

const LIGHT_SURFACES = [
  "color.surface.default",
  "color.surface.muted",
  "color.surface.sunken",
  "color.surface.selected",
];

export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  ...text("color.text.default", ...LIGHT_SURFACES, "color.accent.surface"),
  ...text("color.text.muted", ...LIGHT_SURFACES),
  ...text("color.text.link", "color.surface.default", "color.surface.muted"),
  ...text(
    "color.text.inverse",
    "color.surface.inverse",
    "color.action.primary.background",
    "color.action.primary.background-hover",
  ),
  ...text("color.text.inverse-muted", "color.surface.inverse"),
  ...text(
    "color.action.primary.foreground",
    "color.action.primary.background",
    "color.action.primary.background-hover",
  ),
  ...text(
    "color.action.secondary.foreground",
    "color.action.secondary.background",
    "color.action.secondary.background-hover",
  ),
  ...text(
    "color.action.danger.foreground",
    "color.action.danger.background",
    "color.action.danger.background-hover",
  ),
  ...text("color.accent.text", "color.surface.default", "color.accent.surface"),
  ...text("color.accent.foreground", "color.accent.default"),
  ...text("color.status.success.text", "color.status.success.surface", "color.surface.default"),
  ...text("color.status.warning.text", "color.status.warning.surface", "color.surface.default"),
  ...text("color.status.danger.text", "color.status.danger.surface", "color.surface.default"),
  ...text("color.status.info.text", "color.status.info.surface", "color.surface.default"),
  ...ui("color.border.input", ...LIGHT_SURFACES),
  ...ui("color.action.secondary.border", "color.surface.default", "color.surface.muted"),
  ...ui("color.action.primary.background", "color.surface.default", "color.surface.muted"),
  ...ui("color.action.danger.background", "color.surface.default", "color.surface.muted"),
  ...ui("color.accent.default", "color.surface.default"),
  ...ui("color.focus.ring", ...LIGHT_SURFACES, "color.surface.hover"),
  ...ui("color.focus.ring-inverse", "color.surface.inverse"),
  ...ui("color.tenant.accent", "color.surface.default"),
  ...ui("color.logo.ink", "color.surface.default", "color.surface.muted"),
  ...ui("color.logo.rule", "color.surface.default", "color.surface.muted"),
  ...ui("color.logo.ink-inverse", "color.surface.inverse"),
  ...ui("color.logo.rule-inverse", "color.surface.inverse"),
];

/** Tokens that are text wherever they appear, so each must be in at least one pair as foreground. */
export function isTextToken(path: string): boolean {
  return (
    path.startsWith("color.text.") ||
    /^color\.status\.[a-z-]+\.text$/.test(path) ||
    /^color\.action\.[a-z-]+\.foreground$/.test(path) ||
    path === "color.accent.text" ||
    path === "color.accent.foreground"
  );
}
