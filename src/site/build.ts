/** `just site`: the brand guide into a folder, ready for GitHub Pages. */
import { copyFile, cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { quotationHtml } from "../documents/quotation.ts";
import { sampleQuotation } from "../documents/sample.ts";
import { VERSION, build, cssVariable } from "../tokens.ts";
import { FONTS, layout } from "./layout.ts";
import { type TokenEntry, type TokenIndex, pages } from "./pages.ts";

const LOGO = "docs/brand/logo";
const TENANT_LOGOS = "docs/brand/tenants";
const PROTOTYPE = "prototype";
const STYLES = new URL("./site.css", import.meta.url);

interface Node {
  readonly $value?: unknown;
  readonly $description?: string;
  readonly [key: string]: unknown;
}

function describe(node: unknown, prefix: string[], out: Map<string, string | undefined>): void {
  if (typeof node !== "object" || node === null) {
    return;
  }
  const token = node as Node;
  if ("$value" in token) {
    out.set(prefix.join("."), token.$description);
    return;
  }
  for (const [key, child] of Object.entries(token)) {
    if (!key.startsWith("$")) {
      describe(child, [...prefix, key], out);
    }
  }
}

/** Every token's path, built value and description, in the sources' order. */
async function tokenIndex(builtJson: string): Promise<TokenIndex> {
  const built = (
    JSON.parse(await readFile(builtJson, "utf8")) as { tokens: Record<string, string> }
  ).tokens;
  const descriptions = new Map<string, string | undefined>();
  const files = (await readdir("tokens")).filter((n) => n.endsWith(".tokens.json")).sort();
  for (const name of files) {
    describe(JSON.parse(await readFile(join("tokens", name), "utf8")), [], descriptions);
  }
  const index = new Map<string, TokenEntry>();
  for (const [path, description] of descriptions) {
    const value = built[cssVariable(path).slice(2)];
    if (value !== undefined) {
      index.set(path, { path, value: String(value), description });
    }
  }
  return index;
}

export async function buildSite(out: string): Promise<string[]> {
  await build(out);
  await copyFile(STYLES, join(out, "site.css"));
  for (const [from, to] of [
    [LOGO, "logo"],
    [TENANT_LOGOS, "tenants"],
  ] as const) {
    await mkdir(join(out, to), { recursive: true });
    for (const file of (await readdir(from)).filter((n) => n.endsWith(".svg"))) {
      await copyFile(join(from, file), join(out, to, file));
    }
  }
  // The documents' reference designs, shown in frames by documents.html.
  await mkdir(join(out, "documents"), { recursive: true });
  const quotation = sampleQuotation("../tenants/northfield-supply-logo.svg");
  await writeFile(
    join(out, "documents", "quotation.html"),
    quotationHtml(quotation, "../tokens.css", FONTS),
  );
  const written: string[] = [];
  for (const page of pages(await tokenIndex(join(out, "tokens.json")))) {
    await writeFile(join(out, page.file), layout(page, VERSION));
    written.push(page.file);
  }
  // The clickable prototype, beside the guide: it reads ../tokens.css and ../logo/.
  await cp(PROTOTYPE, join(out, "prototype"), {
    recursive: true,
    filter: (source) => !/(^|\/)prototype\/tools(\/|$)/.test(source.replaceAll("\\", "/")),
  });
  return written;
}
