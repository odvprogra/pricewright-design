/** The brand guide's pages, written from the tokens, the contrast pairs and the logo files. */
import { CONTRAST_PAIRS } from "../contrast-pairs.ts";
import { TEXT_MINIMUM, contrastRatio } from "../contrast.ts";
import type { Email } from "../documents/emails.ts";
import { notice } from "../documents/quotation.ts";
import { SAMPLE_NUMBER } from "../documents/sample.ts";
import { MINIMUM_DISTANCE, PAPER, checkAccent } from "../tenant-accent.ts";
import { RESERVED_TOKENS, TENANTS } from "../tenants.ts";
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

function tenants(tokens: TokenIndex): Page {
  const reserved = Object.fromEntries(
    RESERVED_TOKENS.map((path) => [path, find(tokens, path).value]),
  );
  const cards = TENANTS.map((tenant) => {
    const check = checkAccent(tenant.accent, reserved);
    return `<section>
<h2>${escape(tenant.name)}</h2>
<div class="stage"><img src="tenants/${tenant.slug}-logo.svg" alt="${escape(tenant.name)} logo" height="64">
<img src="tenants/${tenant.slug}-mark.svg" alt="${escape(tenant.name)} mark" height="64"></div>
<div class="table"><table>
<thead><tr><th scope="col">Sample</th><th scope="col">Accent</th><th scope="col" class="number">On white</th>
<th scope="col">Nearest reserved color</th><th scope="col" class="number">ΔEOK</th><th scope="col">Result</th></tr></thead>
<tbody><tr><td><span class="pair" style="color:${tenant.accent};background:${PAPER}">Aa</span>
<span class="pair" style="color:${PAPER};background:${tenant.accent}">Aa</span></td>
<td><code>${tenant.accent}</code></td><td class="number">${check.contrast.toFixed(2)}:1</td>
<td><code>${check.nearest.name}</code></td><td class="number">${check.nearest.distance.toFixed(3)}</td>
${check.problems.length === 0 ? '<td class="pass">Pass</td>' : "<td>Fail</td>"}</tr></tbody></table></div>
</section>`;
  }).join("\n");
  return {
    file: "tenants.html",
    title: "Tenants",
    body: `<section>
<p class="eyebrow">Demo tenants</p>
<h1>Tenants</h1>
<p class="lede">A tenant brings one accent and its logo; everything else stays Pricewright's. Northfield
Supply and Larkspur Tool Co. are the demo's two fictional tenants.</p>
</section>
<section>
<h2>The accent's rules</h2>
<ul>
<li>At least ${TEXT_MINIMUM}:1 on white, so it reads as text and carries white text.</li>
<li>At least ${MINIMUM_DISTANCE.toFixed(2)} ΔEOK, four just-noticeable differences, from every
status color and the focus ring, so it never reads as success, warning, danger, information or focus.</li>
<li>An accent that fails is darkened in OKLab until it reads on white; if that shade still fails,
the default accent, <code>color.tenant.accent</code>, is used.</li>
<li>It colors the tenant's rule in the app's header, the quotation and the emails; never a status,
and never Pricewright's logo.</li>
</ul>
</section>
${cards}`,
  };
}

const NOTICES: readonly { status: string; label: string }[] = [
  { status: "pending_approval", label: "Draft, pending approval or rejected" },
  { status: "expired", label: "Expired" },
  { status: "cancelled", label: "Cancelled" },
  { status: "superseded", label: "Superseded" },
];

function documents(emails: Readonly<Record<string, Email>>): Page {
  const notices = NOTICES.map(({ status, label }) => {
    const shown = notice({ status, validUntil: "2026-11-13" });
    if (shown === null) {
      throw new Error(`no notice for ${status}`);
    }
    const style = `color:var(--color-status-${shown.tone}-text);background:var(--color-status-${shown.tone}-surface)`;
    return `<tr><td>${label}</td><td><span class="pair" style="${style}">${escape(shown.text)}</span></td>
<td><code>color.status.${shown.tone}.*</code></td></tr>`;
  }).join("\n");
  return {
    file: "documents.html",
    title: "Documents",
    body: `<section>
<p class="eyebrow">Documents</p>
<h1>Documents</h1>
<p class="lede">The quotation and the emails are the tenant's documents, set in Ledger's type and
rules: the tenant's name and accent on top, Pricewright only in the closing line.</p>
</section>
<section>
<h2>The quotation</h2>
<p>Quotation ${SAMPLE_NUMBER} from Northfield's demo data, as pricewright-api prints it on A4.
<a href="documents/quotation.html">Open it on its own</a> to print it to PDF.</p>
<iframe class="document-frame" src="documents/quotation.html" title="Quotation ${SAMPLE_NUMBER}, the reference design"></iframe>
</section>
<section>
<h2>Page and type</h2>
<ul>
<li>A4, margins 18 mm at the top, 16 mm at the sides and 20 mm at the bottom; a running footer with
the quote's number on the left and "Page 1 of 2" on the right.</li>
<li>A 10 pt root, so every size token prints in proportion: body 10 pt, the lines' table 8.75 pt,
the footer 7.5 pt.</li>
<li>"Quotation" is the one serif heading (Source Serif 4, 3xl); everything else is Public Sans,
amounts in tabular figures, right-aligned. List prices keep up to four places when they have them;
net prices always show four, so their column lines up.</li>
<li>Both families are embedded (SIL Open Font License), from TrueType files: WeasyPrint subsets
them, so a PDF carries only the glyphs it uses.</li>
<li>The table's header repeats on every page and a line never splits across two; the totals and
the notes stay whole.</li>
</ul>
</section>
<section>
<h2>Color and rules</h2>
<ul>
<li>Text in <code>color.text.default</code> and <code>color.text.muted</code>; the lines' header on
<code>color.surface.muted</code>, rows divided by <code>color.border.default</code>.</li>
<li>The tenant's rule, 2 pt in <code>color.tenant.accent</code> under the masthead, is the only place
the tenant's color appears; the logo (from M7) or the tenant's name sits above it.</li>
<li>The grand total, with its currency, sits between a rule in <code>color.border.strong</code> and
the accountant's double rule in <code>color.text.default</code>, as the logo's sheet closes.</li>
<li>Costs and margins never appear, whoever prints the quote.</li>
</ul>
</section>
<section>
<h2>When it is not an offer</h2>
<p>A notice under the tenant's rule says so, in a status color's text on its surface.</p>
<div class="table"><table>
<thead><tr><th scope="col">Quote</th><th scope="col">Notice</th><th scope="col">Tokens</th></tr></thead>
<tbody>${notices}</tbody></table></div>
</section>
<section>
<h2>The emails</h2>
<p>The quotation sent to the customer, and a manager's decision sent to the rep, from Northfield's
demo data. Each one also has a plain-text part.</p>
${emailFrames(emails)}
</section>
<section>
<h2>Email rules</h2>
<ul>
<li>One column, at most 600 px wide, laid out with tables marked <code>role="presentation"</code>;
facts are a real table with row headers. <code>lang</code> and <code>dir</code> on the root.</li>
<li>Every style inline, every value copied from <code>tokens.json</code>: mail clients drop
<code>&lt;style&gt;</code> blocks and do not resolve <code>var()</code>. Sizes in pixels.</li>
<li>Web-safe stacks, no web fonts (Gmail and Outlook for Windows ignore them): the heading in the serif
stack, from Georgia when Source Serif 4 is not installed; the rest in the sans stack, from Segoe UI.</li>
<li>The tenant's rule, 4 px in its accent, tops the card; the tenant's name (its logo from M7) sits
under it; Pricewright appears only in the footer.</li>
<li>A preview line follows the subject in the inbox; a manager's comment is quoted, first when it
asks for changes. Customers read formal sentences without contractions; reps read the app's voice.</li>
<li>Light only (<code>color-scheme: light</code>) until the tokens have a dark theme.</li>
</ul>
</section>`,
  };
}

function emailFrames(emails: Readonly<Record<string, Email>>): string {
  return Object.entries(emails)
    .map(
      ([name, email]) => `<figure class="email">
<figcaption><b>${escape(email.subject)}</b><span>${escape(email.preheader)}</span>
<a href="documents/${name}.txt">Plain text</a></figcaption>
<iframe class="email-frame" src="documents/${name}.html" title="Email: ${escape(email.subject)}"></iframe>
</figure>`,
    )
    .join("\n");
}

export function pages(tokens: TokenIndex, emails: Readonly<Record<string, Email>>): Page[] {
  return [home(), color(tokens), type(tokens), logo(), tenants(tokens), documents(emails)];
}
