/** The brand guide's pages, written from the tokens, the contrast pairs and the logo files. */
import { CONTRAST_PAIRS } from "../contrast-pairs.ts";
import { contrastRatio } from "../contrast.ts";
import { type Page, escape } from "./layout.ts";

export interface TokenEntry {
  readonly path: string;
  readonly value: string;
  readonly description: string | undefined;
}

export type TokenIndex = ReadonlyMap<string, TokenEntry>;

const SAMPLE = "NF-2026-000132 · Stonegate Storage Centers · 3,086.67 USD";

function find(tokens: TokenIndex, path: string): TokenEntry {
  const entry = tokens.get(path);
  if (entry === undefined) {
    throw new Error(`no token ${path}`);
  }
  return entry;
}

function swatch(entry: TokenEntry): string {
  const about = entry.description === undefined ? "" : `<span>${escape(entry.description)}</span>`;
  return `<figure class="swatch"><div class="chip" style="background:${entry.value}"></div>
<figcaption class="about"><b>${escape(entry.path)}</b><span>${entry.value}</span>${about}</figcaption></figure>`;
}

function home(): Page {
  return {
    file: "index.html",
    title: "Brand",
    body: `<section>
<p class="eyebrow">Brand guide</p>
<h1>Every price, explained; every decision, on the record.</h1>
<p class="lede">Pricewright is a quote-to-order platform for B2B distributors. Its brand, Ledger, reads
as the document of record: navy and verdigris on white paper, serif headings, exact numbers.</p>
</section>
<section>
<h2>Positioning</h2>
<p>For sales teams at mid-size B2B distributors who quote prices by hand and approve large discounts
over chat, Pricewright is a quote-to-order platform that prices every line with a transparent
waterfall of discounts, routes the risky ones for approval and keeps the record of every decision.</p>
</section>
<section>
<h2>Personality</h2>
<div class="table"><table>
<thead><tr><th scope="col">Trait</th><th scope="col">Is</th><th scope="col">Is not</th></tr></thead>
<tbody>
<tr><td>Precise</td><td>Exact numbers, exact names, the rule that applied</td><td>Vague, rounded, approximate</td></tr>
<tr><td>Careful</td><td>Confirms what matters, keeps history, never surprises</td><td>Slow, bureaucratic, fussy</td></tr>
<tr><td>Permanent</td><td>Looks like a document you can file and audit later</td><td>Old-fashioned, stiff, ornate</td></tr>
</tbody></table></div>
<p>Voice and tone, the word list and the mechanics are in
<a href="https://github.com/odvprogra/pricewright-design/blob/main/docs/brand/voice-and-tone.md">the
repository</a>.</p>
</section>`,
  };
}

function color(tokens: TokenIndex): Page {
  const entries = [...tokens.values()].filter((t) => t.value.startsWith("#"));
  const palette = entries.filter((t) => t.path.startsWith("palette."));
  const semantic = entries.filter((t) => t.path.startsWith("color."));
  const rows = CONTRAST_PAIRS.map((pair) => {
    const fg = find(tokens, pair.foreground).value;
    const bg = find(tokens, pair.background).value;
    const ratio = contrastRatio(fg, bg);
    const kind = pair.minimum >= 4.5 ? "Text" : "UI";
    return `<tr><td><span class="pair" style="color:${fg};background:${bg}">Aa</span></td>
<td><code>${pair.foreground}</code><br><span class="muted">on <code>${pair.background}</code></span></td>
<td class="number">${ratio.toFixed(2)}:1</td><td class="number">${kind} ${pair.minimum}:1</td>
<td class="pass">Pass</td></tr>`;
  }).join("\n");
  return {
    file: "color.html",
    title: "Color",
    body: `<section>
<p class="eyebrow">Color</p>
<h1>Color</h1>
<p class="lede">Components use the semantic tokens; the palette exists only to define them. Every pair
a screen can draw is tested against WCAG 2.2 AA: 4.5:1 for text, 3:1 for controls and focus.</p>
</section>
<section>
<h2>Semantic tokens</h2>
<div class="grid">${semantic.map(swatch).join("\n")}</div>
</section>
<section>
<h2>Contrast</h2>
<p>${CONTRAST_PAIRS.length} pairs, computed from the built tokens; the tests fail if one falls short.</p>
<div class="table"><table>
<thead><tr><th scope="col">Sample</th><th scope="col">Pair</th><th scope="col" class="number">Ratio</th>
<th scope="col" class="number">Minimum</th><th scope="col">Result</th></tr></thead>
<tbody>${rows}</tbody></table></div>
</section>
<section>
<h2>Palette</h2>
<div class="grid">${palette.map(swatch).join("\n")}</div>
</section>`,
  };
}

function type(tokens: TokenIndex): Page {
  const sizes = [...tokens.values()].filter((t) => t.path.startsWith("font.size."));
  const specimens = sizes
    .map((size) => {
      const step = size.path.split(".").pop() ?? "";
      const serif = ["xl", "2xl", "3xl", "4xl"].includes(step);
      const family = serif ? "var(--font-family-heading)" : "var(--font-family-body)";
      const weight = serif ? "var(--font-weight-semibold)" : "var(--font-weight-regular)";
      return `<div class="specimen"><span class="meta">font.size.${step} · ${size.value} ·
${serif ? "Source Serif 4" : "Public Sans"}</span>
<span class="tabular" style="font-size:${size.value};font-family:${family};font-weight:${weight}">${SAMPLE}</span></div>`;
    })
    .join("\n");
  return {
    file: "type.html",
    title: "Type",
    body: `<section>
<p class="eyebrow">Typography</p>
<h1>Type</h1>
<p class="lede">Source Serif 4 for headings from the xl size up and for customer documents; Public
Sans for the interface, every table and every amount, always in tabular figures.</p>
</section>
<section>
<h2>Scale</h2>
${specimens}
</section>
<section>
<h2>Rules</h2>
<ul>
<li>Serif never in tables, forms or dense lists, and never below the xl size.</li>
<li>Amounts in tabular figures (<code>font-variant-numeric: tabular-nums</code>), right-aligned.</li>
<li>Both families are licensed under the SIL Open Font License, so PDFs can embed them.</li>
</ul>
</section>`,
  };
}

function logo(): Page {
  const files = [
    ["pricewright-logo.svg", "Primary logo"],
    ["pricewright-logo-inverse.svg", "On navy"],
    ["pricewright-mark.svg", "Mark, 24 px and up"],
    ["pricewright-mark-inverse.svg", "Mark on navy"],
    ["pricewright-mark-small.svg", "Small mark, below 24 px"],
  ];
  const downloads = files
    .map(([file, label]) => `<li><a href="logo/${file}">${label}</a> <code>${file}</code></li>`)
    .join("\n");
  return {
    file: "logo.html",
    title: "Logo",
    body: `<section>
<p class="eyebrow">Logo</p>
<h1>Logo</h1>
<p class="lede">A ruled ledger sheet closed by the accountant's double rule. The wordmark's baseline is
the double rule's lower line: the name sits on the total, as an amount does.</p>
</section>
<section>
<h2>On white</h2>
<div class="stage"><img src="logo/pricewright-logo.svg" alt="Pricewright logo" height="64">
<img src="logo/pricewright-mark.svg" alt="Pricewright mark" height="64">
<img src="logo/pricewright-mark-small.svg" alt="Pricewright small mark" height="32"></div>
</section>
<section>
<h2>On navy</h2>
<div class="stage inverse"><img src="logo/pricewright-logo-inverse.svg" alt="Pricewright logo on navy" height="64">
<img src="logo/pricewright-mark-inverse.svg" alt="Pricewright mark on navy" height="64"></div>
</section>
<section>
<h2>Files</h2>
<ul>${downloads}</ul>
<p>Clear space: a quarter of the logo's height on every side. Minimum size: 24 px high; below
that, the small mark. Never recolored, stretched or set in another font.</p>
</section>`,
  };
}

export function pages(tokens: TokenIndex): Page[] {
  return [home(), color(tokens), type(tokens), logo()];
}
