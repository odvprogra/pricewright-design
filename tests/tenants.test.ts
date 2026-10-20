import { readFile, readdir } from "node:fs/promises";

import fc from "fast-check";
import { beforeAll, describe, expect, it } from "vitest";

import { UI_MINIMUM, contrastRatio } from "../src/contrast.ts";
import { builtTokens } from "../src/logo-files.ts";
import {
  MINIMUM_DISTANCE,
  PAPER,
  accessibleAccent,
  checkAccent,
  distance,
  hexFromOklab,
  oklab,
} from "../src/tenant-accent.ts";
import { TENANTS, reservedColors, tenantLogoFiles } from "../src/tenants.ts";

const DIRECTORY = "docs/brand/tenants";

const hexColor = fc
  .tuple(
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
  )
  .map(([r, g, b]) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`);

let reserved: Record<string, string>;
let fallback: string;
let generated: Record<string, string>;

beforeAll(async () => {
  const tokens = await builtTokens();
  reserved = reservedColors(tokens);
  fallback = tokens["color-tenant-accent"] ?? "";
  generated = tenantLogoFiles();
});

describe("the demo tenants", () => {
  it("are Northfield Supply and Larkspur Tool Co.", () => {
    expect(TENANTS.map((t) => t.name)).toEqual(["Northfield Supply", "Larkspur Tool Co."]);
  });

  it("have accents that meet every rule", () => {
    for (const tenant of TENANTS) {
      expect(checkAccent(tenant.accent, reserved).problems, tenant.name).toEqual([]);
    }
  });

  it("draw their logos' ink at 3:1 or more on white", () => {
    for (const tenant of TENANTS) {
      expect(contrastRatio(tenant.ink, PAPER), tenant.name).toBeGreaterThanOrEqual(UI_MINIMUM);
    }
  });

  it("fall back to a default accent that meets the rules itself", () => {
    expect(checkAccent(fallback, reserved).problems).toEqual([]);
  });
});

describe("the tenants' logo files", () => {
  it("are exactly what `just logo` generates", async () => {
    const committed = (await readdir(DIRECTORY)).filter((name) => name.endsWith(".svg")).sort();

    expect(committed).toEqual(Object.keys(generated).sort());
    for (const name of committed) {
      expect(await readFile(`${DIRECTORY}/${name}`, "utf8"), name).toBe(generated[name]);
    }
  });

  it("need no font and are named for assistive technology", () => {
    for (const tenant of TENANTS) {
      for (const name of [`${tenant.slug}-logo.svg`, `${tenant.slug}-mark.svg`]) {
        const svg = generated[name] ?? "";
        expect(svg, name).not.toMatch(/<text|font-family|@font-face/);
        expect(svg, name).toContain('role="img"');
        expect(svg, name).toContain(`<title>${tenant.name}</title>`);
      }
    }
  });

  it("use only the tenant's accent and ink", () => {
    for (const tenant of TENANTS) {
      const colors = new Set(generated[`${tenant.slug}-logo.svg`]?.match(/#[0-9a-f]{6}/g));
      expect(colors, tenant.name).toEqual(new Set([tenant.accent, tenant.ink]));
    }
  });
});

describe("checkAccent", () => {
  it("refuses an accent too light to read on white", () => {
    expect(checkAccent("#5fb8ad", reserved).problems).toEqual([
      expect.stringMatching(/^contrast 2\.\d\d:1 on white, below 4\.5:1$/),
    ]);
  });

  it("refuses an accent that reads as a status color", () => {
    const rust = checkAccent("#a3401f", reserved);

    expect(rust.nearest.name).toBe("color.status.danger.text");
    expect(rust.problems).toEqual([
      "ΔEOK 0.058 from color.status.warning.text, below 0.08",
      "ΔEOK 0.056 from color.status.danger.text, below 0.08",
      "ΔEOK 0.073 from color.action.danger.background, below 0.08",
    ]);
  });

  it("refuses every reserved color itself", () => {
    for (const [name, color] of Object.entries(reserved)) {
      expect(checkAccent(color, reserved).nearest, name).toEqual({ name, distance: 0 });
    }
  });
});

describe("accessibleAccent", () => {
  it("keeps an accent that passes", () => {
    expect(accessibleAccent("#36597a", reserved, fallback)).toBe("#36597a");
  });

  it("darkens a light accent of the same hue until it reads on white", () => {
    const shade = accessibleAccent("#7fa6cc", reserved, fallback);

    expect(shade).not.toBe(fallback);
    expect(checkAccent(shade, reserved).problems).toEqual([]);
    expect(distance(shade, "#7fa6cc")).toBeLessThan(0.25);
  });

  it("falls back to the default when no shade of the hue can pass", () => {
    expect(accessibleAccent("#a3401f", reserved, fallback)).toBe(fallback);
  });

  it("always answers an accent that meets the rules", () => {
    fc.assert(
      fc.property(hexColor, (accent) => {
        const result = accessibleAccent(accent, reserved, fallback);
        return checkAccent(result, reserved).problems.length === 0;
      }),
    );
  });
});

describe("OKLab", () => {
  it("returns every sRGB color unchanged after a round trip", () => {
    fc.assert(fc.property(hexColor, (hex) => hexFromOklab(oklab(hex)) === hex));
  });

  it("puts white at lightness 1 and black at 0", () => {
    expect(oklab("#ffffff")[0]).toBeCloseTo(1, 4);
    expect(oklab("#000000")[0]).toBeCloseTo(0, 10);
  });

  it("keeps four just-noticeable differences between an accent and a reserved color", () => {
    expect(MINIMUM_DISTANCE).toBeCloseTo(0.08, 10);
  });
});
