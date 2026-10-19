import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { contrastRatio, relativeLuminance } from "../src/contrast.ts";

const hexColor = fc
  .tuple(
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
  )
  .map(([r, g, b]) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`);

describe("contrastRatio", () => {
  it("is 21 for black on white, the maximum", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 10);
  });

  it("puts #767676 on white just above 4.5:1 and #777777 just below", () => {
    expect(contrastRatio("#767676", "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#777777", "#ffffff")).toBeLessThan(4.5);
  });

  it("does not depend on the order of the colors", () => {
    fc.assert(
      fc.property(hexColor, hexColor, (a, b) => contrastRatio(a, b) === contrastRatio(b, a)),
    );
  });

  it("stays between 1 and 21", () => {
    fc.assert(
      fc.property(hexColor, hexColor, (a, b) => {
        const ratio = contrastRatio(a, b);
        return ratio >= 1 && ratio <= 21 + 1e-9;
      }),
    );
  });

  it("is 1 for a color against itself", () => {
    fc.assert(fc.property(hexColor, (a) => Math.abs(contrastRatio(a, a) - 1) < 1e-12));
  });

  it("grows as a grey on white gets darker", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 255 }), (level) => {
        const grey = (v: number) => `#${v.toString(16).padStart(2, "0").repeat(3)}`;
        return contrastRatio(grey(level - 1), "#ffffff") > contrastRatio(grey(level), "#ffffff");
      }),
    );
  });
});

describe("relativeLuminance", () => {
  it("refuses anything but #rrggbb", () => {
    expect(() => relativeLuminance("#fff")).toThrow("expected a #rrggbb color");
    expect(() => relativeLuminance("rgb(0, 0, 0)")).toThrow("expected a #rrggbb color");
  });
});
