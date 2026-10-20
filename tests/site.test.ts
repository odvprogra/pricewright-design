import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { CONTRAST_PAIRS } from "../src/contrast-pairs.ts";
import { NAVIGATION } from "../src/site/layout.ts";
import { buildSite } from "../src/site/build.ts";

let out: string;
let written: string[];
const html = new Map<string, string>();

beforeAll(async () => {
  out = await mkdtemp(join(tmpdir(), "pricewright-site-"));
  written = await buildSite(out);
  for (const file of written) {
    html.set(file, await readFile(join(out, file), "utf8"));
  }
});

afterAll(async () => {
  await rm(out, { recursive: true, force: true });
});

describe("the brand guide", () => {
  it("writes every page in the navigation", () => {
    expect(written.sort()).toEqual(NAVIGATION.map((item) => item.file).sort());
  });

  it("styles every page with the tokens and marks the current page", () => {
    for (const { file } of NAVIGATION) {
      const page = html.get(file) ?? "";
      expect(page, file).toContain('<html lang="en">');
      expect(page, file).toContain('href="tokens.css"');
      expect(page, file).toContain('href="site.css"');
      expect(page, file).toContain(`<a href="${file}" aria-current="page">`);
    }
  });

  it("gives every image a text alternative", () => {
    for (const [file, page] of html) {
      const images = page.match(/<img\b[^>]*>/g) ?? [];
      expect(images.length, file).toBeGreaterThan(0);
      for (const image of images) {
        expect(image, file).toMatch(/\balt="[^"]+"/);
      }
    }
  });

  it("lists every contrast pair the tests check", () => {
    const rows = (html.get("color.html") ?? "").match(/<td class="pass">Pass<\/td>/g) ?? [];

    expect(rows).toHaveLength(CONTRAST_PAIRS.length);
  });

  it("takes every color in its stylesheet from the tokens", async () => {
    const css = await readFile(join(out, "site.css"), "utf8");

    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/i);
  });

  it("ships every image it shows", async () => {
    for (const [file, page] of html) {
      for (const [, source] of page.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) {
        expect(await readFile(join(out, source ?? ""), "utf8"), `${file}: ${source}`).toContain(
          "<svg",
        );
      }
    }
  });

  it("checks each demo tenant's accent on the tenants page", () => {
    const page = html.get("tenants.html") ?? "";

    expect(page.match(/<td class="pass">Pass<\/td>/g)).toHaveLength(2);
    expect(page).toContain("#36597a");
    expect(page).toContain("#6b2f74");
  });
});
