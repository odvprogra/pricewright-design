import { readFile, readdir } from "node:fs/promises";

import { beforeAll, describe, expect, it } from "vitest";

import { logoFiles } from "../src/logo-files.ts";

const DIRECTORY = "docs/brand/logo";
let generated: Record<string, string>;

beforeAll(async () => {
  generated = await logoFiles();
});

describe("the logo files", () => {
  it("are exactly what `just logo` generates from the tokens", async () => {
    const committed = (await readdir(DIRECTORY)).filter((name) => name.endsWith(".svg")).sort();

    expect(committed).toEqual(Object.keys(generated).sort());
    for (const name of committed) {
      expect(await readFile(`${DIRECTORY}/${name}`, "utf8"), name).toBe(generated[name]);
    }
  });

  it("need no font: the wordmark is outlined", () => {
    for (const [name, svg] of Object.entries(generated)) {
      expect(svg, name).not.toMatch(/<text|font-family|@font-face/);
    }
  });

  it("are named for assistive technology", () => {
    for (const [name, svg] of Object.entries(generated)) {
      expect(svg, name).toContain('role="img"');
      expect(svg, name).toContain("<title>Pricewright</title>");
    }
  });

  it("sit on the mark's 32-unit grid, the small mark on 16", () => {
    expect(generated["pricewright-mark.svg"]).toContain('viewBox="0 0 32 32"');
    expect(generated["pricewright-logo.svg"]).toMatch(/viewBox="0 0 \d+ 32"/);
    expect(generated["pricewright-mark-small.svg"]).toContain('viewBox="0 0 16 16"');
  });
});
