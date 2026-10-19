/**
 * The token build (ADR-0004): DTCG sources in `tokens/` become `tokens.css`, `theme.css` (a
 * Tailwind CSS v4 theme with shadcn/ui's names) and `tokens.json`.
 */
import { readFileSync } from "node:fs";

import StyleDictionary from "style-dictionary";
import type { Config, TransformedToken } from "style-dictionary/types";

const SOURCE = ["tokens/**/*.tokens.json"];

/** The package's version, which release-please bumps: every build says which release it is. */
export const VERSION: string = (
  JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
    version: string;
  }
).version;

const HEADER = `pricewright-design ${VERSION}: generated from tokens/; do not edit.`;

/** shadcn/ui's theme names and the semantic token each one stands for. */
export const SHADCN_ALIASES: Readonly<Record<string, string>> = {
  background: "color.surface.default",
  foreground: "color.text.default",
  card: "color.surface.default",
  "card-foreground": "color.text.default",
  popover: "color.surface.default",
  "popover-foreground": "color.text.default",
  primary: "color.action.primary.background",
  "primary-foreground": "color.action.primary.foreground",
  secondary: "color.action.secondary.background",
  "secondary-foreground": "color.action.secondary.foreground",
  muted: "color.surface.muted",
  "muted-foreground": "color.text.muted",
  // shadcn's accent is the hover and selected surface of menus and rows, not the brand accent.
  accent: "color.surface.hover",
  "accent-foreground": "color.text.default",
  destructive: "color.action.danger.background",
  "destructive-foreground": "color.action.danger.foreground",
  border: "color.border.default",
  input: "color.border.input",
  ring: "color.focus.ring",
};

/** Tailwind namespaces the theme replaces, so no default value of theirs survives. */
const RESET_NAMESPACES = ["color", "radius", "shadow", "text", "leading", "ease"];

/** A token path as its custom property: `color.surface.muted` is `--color-surface-muted`. */
export function cssVariable(path: string): string {
  return `--${path.replaceAll(".", "-")}`;
}

/**
 * The Tailwind CSS v4 theme variable of a token, or `undefined` when it has no Tailwind namespace
 * (palette values, spacing steps, border widths, durations stay in `tokens.css` only).
 */
export function tailwindVariable(path: readonly string[]): string | undefined {
  const [group, kind, ...rest] = path;
  const name = rest.join("-");
  if (group === "color") {
    return `--${path.join("-")}`;
  }
  if (group === "font" && rest.length > 0) {
    const namespace: Record<string, string> = {
      family: "font",
      weight: "font-weight",
      size: "text",
      leading: "leading",
    };
    return kind !== undefined && kind in namespace ? `--${namespace[kind]}-${name}` : undefined;
  }
  if (group === "radius" || group === "shadow") {
    return `--${path.join("-")}`;
  }
  if (group === "motion" && kind === "ease") {
    return `--ease-${name}`;
  }
  if (group === "space" && kind === "unit") {
    return "--spacing";
  }
  return undefined;
}

interface DtcgColor {
  colorSpace: string;
  components: number[];
  alpha?: number;
}

interface DtcgDimension {
  value: number;
  unit: string;
}

interface DtcgShadow {
  color: DtcgColor | string;
  offsetX: DtcgDimension;
  offsetY: DtcgDimension;
  blur: DtcgDimension;
  spread: DtcgDimension;
}

/** sRGB colors as `#rrggbb`, or `rgba()` when translucent: forms every consumer understands. */
export function cssColor(color: DtcgColor | string): string {
  if (typeof color === "string") {
    return color;
  }
  if (color.colorSpace !== "srgb") {
    throw new Error(`only sRGB colors are supported, got ${color.colorSpace}`);
  }
  const channels = color.components.map((c) => Math.round(c * 255));
  if (color.alpha !== undefined && color.alpha < 1) {
    return `rgba(${channels.join(", ")}, ${color.alpha})`;
  }
  return `#${channels.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

const dimension = (d: DtcgDimension): string => `${d.value}${d.unit}`;

StyleDictionary.registerTransform({
  name: "pricewright/color",
  type: "value",
  transitive: true,
  filter: (token) => token.$type === "color",
  transform: (token) => cssColor(token.$value as DtcgColor | string),
});

StyleDictionary.registerTransform({
  name: "pricewright/shadow",
  type: "value",
  transitive: true,
  filter: (token) => token.$type === "shadow",
  transform: (token) => {
    const layers = [token.$value as DtcgShadow | DtcgShadow[]].flat();
    return layers
      .map((s) =>
        [s.offsetX, s.offsetY, s.blur, s.spread].map(dimension).concat(cssColor(s.color)).join(" "),
      )
      .join(", ");
  },
});

StyleDictionary.registerTransform({
  name: "pricewright/duration",
  type: "value",
  filter: (token) => token.$type === "duration",
  transform: (token) => dimension(token.$value as DtcgDimension),
});

/** Style Dictionary's CSS transforms, with ours for colors, shadows and durations. */
const TRANSFORMS = [
  ...(StyleDictionary.hooks.transformGroups["css"] ?? []).filter(
    (name) => !["color/css", "shadow/css/shorthand", "time/seconds"].includes(name),
  ),
  "pricewright/color",
  "pricewright/shadow",
  "pricewright/duration",
];

function tailwindTheme(tokens: readonly TransformedToken[]): string {
  const themed = tokens.flatMap((token) => {
    const variable = tailwindVariable(token.path);
    return variable === undefined ? [] : [`  ${variable}: ${String(token.$value)};`];
  });
  const lines = [
    `/* ${HEADER} */`,
    "",
    "/* Tailwind's defaults are reset in these namespaces: only Pricewright's tokens remain. */",
    "@theme {",
    ...RESET_NAMESPACES.map((namespace) => `  --${namespace}-*: initial;`),
    ...themed,
    "}",
    "",
    "/* shadcn/ui's theme names, as aliases of the semantic tokens. */",
    "@theme inline {",
    ...Object.entries(SHADCN_ALIASES).map(
      ([name, path]) => `  --color-${name}: var(${cssVariable(path)});`,
    ),
    "}",
    "",
  ];
  return lines.join("\n");
}

StyleDictionary.registerFormat({
  name: "json/versioned",
  format: ({ dictionary }) => {
    const tokens = Object.fromEntries(dictionary.allTokens.map((t) => [t.name, t.$value]));
    return `${JSON.stringify({ name: "pricewright-design", version: VERSION, tokens }, null, 2)}\n`;
  },
});

StyleDictionary.registerFormat({
  name: "css/tailwind-theme",
  format: ({ dictionary }) =>
    tailwindTheme(dictionary.allTokens.filter((token) => token.path[0] !== "palette")),
});

export function config(buildPath: string): Config {
  const destination = buildPath.endsWith("/") ? buildPath : `${buildPath}/`;
  return {
    source: SOURCE,
    usesDtcg: true,
    log: { warnings: "error", verbosity: "verbose" },
    platforms: {
      css: {
        transforms: TRANSFORMS,
        buildPath: destination,
        files: [
          {
            destination: "tokens.css",
            format: "css/variables",
            // Resolved values: email clients and some PDF renderers do not resolve var().
            options: { outputReferences: false, fileHeader: () => [HEADER] },
          },
          { destination: "theme.css", format: "css/tailwind-theme" },
          { destination: "tokens.json", format: "json/versioned" },
        ],
      },
    },
  };
}

/** Build every format into `buildPath`. */
export async function build(buildPath: string): Promise<void> {
  const dictionary = new StyleDictionary(config(buildPath));
  await dictionary.buildAllPlatforms();
}
