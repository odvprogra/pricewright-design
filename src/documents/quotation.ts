/**
 * The quotation's reference design: the page pricewright-api prints with WeasyPrint (its ADR-0027),
 * written here on the tokens so the brand guide shows it and the API copies it. Every color and
 * size is a custom property from `tokens.css`; the only value set here is the tenant's accent.
 */
import { escape } from "../site/layout.ts";

export interface QuotationLine {
  readonly sku: string;
  readonly description: string;
  readonly quantity: string;
  readonly unit: string;
  readonly listUnitPrice: string;
  readonly netUnitPrice: string;
  readonly netTotal: string;
}

export interface Quotation {
  readonly tenant: { readonly name: string; readonly accent: string; readonly logo?: string };
  readonly number: string;
  readonly status: string;
  /** Submitted, or created for a draft: the document's date. */
  readonly date: string;
  readonly validUntil: string;
  readonly preparedBy: string;
  readonly customer: { readonly name: string; readonly accountNumber: string };
  readonly currency: string;
  readonly lines: readonly QuotationLine[];
  readonly netSubtotal: string;
  readonly taxRate: string;
  readonly tax: string;
  readonly total: string;
  readonly notes: string | null;
}

export type Tone = "warning" | "danger" | "info";

/** What the quotation says when it is not an offer (pricewright-api ADR-0027), and its tone. */
export function notice(quotation: Pick<Quotation, "status" | "validUntil">): {
  text: string;
  tone: Tone;
} | null {
  switch (quotation.status) {
    case "draft":
    case "pending_approval":
    case "rejected":
      return {
        text: "Draft, not an offer: prices may change until the quote is approved.",
        tone: "warning",
      };
    case "expired":
      return {
        text: `This offer has expired: it was valid until ${longDate(quotation.validUntil)}.`,
        tone: "danger",
      };
    case "cancelled":
      return { text: "Cancelled: this quote is no longer an offer.", tone: "danger" };
    case "superseded":
      return {
        text: "Replaced by a later revision: this quote is no longer an offer.",
        tone: "info",
      };
    default:
      return null;
  }
}

const LONG_DATE = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** Customer documents spell the month in full: "November 13, 2026". */
export function longDate(iso: string): string {
  return LONG_DATE.format(new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso));
}

/** A decimal string grouped by thousands, to at least `places` and at most four: "1,833.29". */
export function grouped(amount: string, places = 2): string {
  const [whole = "0", fraction = ""] = amount.split(".");
  let digits = fraction.padEnd(places, "0");
  while (digits.length > places && digits.endsWith("0")) {
    digits = digits.slice(0, -1);
  }
  return `${BigInt(whole).toLocaleString("en-US")}.${digits.slice(0, 4)}`;
}

/** A result as a percentage to one decimal, unless whole: 0.173 is "17.3%", 0.12 is "12%". */
export function percent(ratio: number): string {
  return `${(ratio * 100).toFixed(1).replace(/\.0$/, "")}%`;
}

/** A configured rate exactly, without trailing zeros: "0.0725" is "7.25%", "0.10" is "10%". */
export function rate(ratio: string): string {
  const [whole = "0", fraction = ""] = ratio.split(".");
  const digits = `${whole}${fraction.padEnd(2, "0")}`;
  const point = whole.length + 2;
  const integer = BigInt(digits.slice(0, point)).toString();
  const decimals = digits.slice(point).replace(/0+$/, "");
  return `${integer}${decimals === "" ? "" : `.${decimals}`}%`;
}

/** Text as a CSS string literal. */
function cssString(text: string): string {
  return `"${text.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

/** The share of the list price given away on a line, as the API computes it; 0 at list price. */
export function lineDiscount(line: QuotationLine): number {
  const list = Number(line.listUnitPrice) * Number(line.quantity);
  return list === 0 ? 0 : Math.round((1 - Number(line.netTotal) / list) * 1000) / 1000;
}

const UNITS: Readonly<Record<string, string>> = {
  EA: "each",
  PR: "pair",
  DZN: "dozen",
  SET: "set",
  XBG: "bag",
  XBX: "box",
  XBE: "bundle",
  XCT: "carton",
  XCS: "case",
  XPK: "package",
  XPA: "packet",
  XPL: "pail",
  XRO: "roll",
};

/** The API's quantity: the number, then the unit's name in lower case ("83 box"). */
export function quantity(line: QuotationLine): string {
  return `${line.quantity} ${UNITS[line.unit] ?? line.unit}`;
}

/** A4 with the running footer: the quote's number on the left, the page count on the right. */
function page(number: string): string {
  return `@page {
  size: A4;
  margin: 18mm 16mm 20mm;
  @bottom-left {
    content: ${cssString(number)};
    font-family: var(--font-family-body);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  @bottom-right {
    content: "Page " counter(page) " of " counter(pages);
    font-family: var(--font-family-body);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
}`;
}

const STYLES = `
/* Print sizes: every rem token scales from a 10 pt root (md 10 pt, sm 8.75 pt, xs 7.5 pt). */
html { font-size: 10pt; }
body {
  margin: 0;
  color: var(--color-text-default);
  font-family: var(--font-family-body);
  font-size: var(--font-size-md);
  line-height: var(--font-leading-snug);
  /* Browsers drop backgrounds when printing; the table's header and the notices need theirs. */
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}
@media screen {
  body { background: var(--color-surface-muted); padding: var(--space-6) 0; }
  .sheet {
    box-sizing: border-box;
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 18mm 16mm 20mm;
    background: var(--color-surface-default);
    box-shadow: var(--shadow-md);
  }
}
.masthead { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-8); }
.issuer { display: grid; gap: var(--space-3); }
.issuer .logo { height: 2.5rem; width: auto; display: block; }
.issuer .name { margin: 0; font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); }
h1 {
  margin: 0;
  font-family: var(--font-family-heading);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--font-leading-tight);
}
.facts {
  display: grid;
  grid-template-columns: auto auto;
  gap: var(--space-1) var(--space-4);
  margin: 0;
  font-size: var(--font-size-sm);
}
.facts dt { color: var(--color-text-muted); }
.facts dd { margin: 0; text-align: right; white-space: nowrap; }
/* The tenant's rule: the one place the tenant's accent appears on the page. */
.tenant-rule { border: 0; border-top: 2pt solid var(--color-tenant-accent); margin: var(--space-4) 0 0; }
.notice { margin: var(--space-4) 0 0; padding: var(--space-2) var(--space-3); font-weight: var(--font-weight-semibold); }
.notice.warning { color: var(--color-status-warning-text); background: var(--color-status-warning-surface); }
.notice.danger { color: var(--color-status-danger-text); background: var(--color-status-danger-surface); }
.notice.info { color: var(--color-status-info-text); background: var(--color-status-info-surface); }
.label {
  margin: 0 0 var(--space-1);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.party { margin: var(--space-8) 0 var(--space-6); }
.party .name { margin: 0; font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); }
.party p { margin: 0; }
table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.lines th {
  text-align: left;
  font-weight: var(--font-weight-semibold);
  background: var(--color-surface-muted);
  border-bottom: var(--border-width-default) solid var(--color-border-strong);
  padding: var(--space-2);
}
.lines td { border-bottom: var(--border-width-default) solid var(--color-border-default); padding: var(--space-2); vertical-align: top; }
.lines thead { display: table-header-group; }
.lines tr { break-inside: avoid; }
.number { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.lines th.number { text-align: right; }
.sku { color: var(--color-text-muted); white-space: nowrap; }
.totals { width: 50%; margin: var(--space-4) 0 0 auto; font-size: var(--font-size-md); break-inside: avoid; }
.totals th { text-align: left; font-weight: var(--font-weight-regular); padding: var(--space-1) var(--space-2); }
.totals td { padding: var(--space-1) var(--space-2); }
/* The accountant's double rule closes the grand total, as it closes the logo's sheet. */
.totals .grand th, .totals .grand td {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  border-top: var(--border-width-default) solid var(--color-border-strong);
  border-bottom: 3pt double var(--color-text-default);
  padding-top: var(--space-2);
  padding-bottom: var(--space-2);
}
.notes { margin-top: var(--space-8); break-inside: avoid; }
.notes p { margin: 0; white-space: pre-line; max-width: 68ch; }
.closing { margin-top: var(--space-12); font-size: var(--font-size-xs); color: var(--color-text-muted); }
.closing p { margin: 0 0 var(--space-1); }
`;

/**
 * The quotation as a page: `tokens` is the path to a release's `tokens.css`, `fonts` a stylesheet
 * that loads Source Serif 4 and Public Sans (Google Fonts here; the API embeds the OFL files).
 */
export function quotationHtml(q: Quotation, tokens: string, fonts: string): string {
  const issuer =
    q.tenant.logo === undefined
      ? `<p class="name">${escape(q.tenant.name)}</p>`
      : `<img class="logo" src="${escape(q.tenant.logo)}" alt="${escape(q.tenant.name)}">`;
  const status = notice(q);
  const rows = q.lines
    .map((line) => {
      const off = lineDiscount(line);
      return `<tr><td class="sku">${escape(line.sku)}</td><td>${escape(line.description)}</td>
<td class="number">${escape(quantity(line))}</td><td class="number">${grouped(line.listUnitPrice)}</td>
<td class="number">${off === 0 ? "" : percent(off)}</td><td class="number">${grouped(line.netUnitPrice, 4)}</td>
<td class="number">${grouped(line.netTotal)}</td></tr>`;
    })
    .join("\n");
  const notes =
    q.notes === null
      ? ""
      : `<section class="notes"><h2 class="label">Notes</h2><p>${escape(q.notes)}</p></section>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(q.tenant.name)} quotation ${escape(q.number)}</title>
<link rel="stylesheet" href="${escape(fonts)}">
<link rel="stylesheet" href="${escape(tokens)}">
<style>
/* The one override a consumer makes: the tenant's accent (ADR-0005). */
:root { --color-tenant-accent: ${q.tenant.accent}; }
${page(q.number)}
${STYLES.trim()}
</style>
</head>
<body>
<div class="sheet">
<header class="masthead">
<div class="issuer">${issuer}<h1>Quotation</h1></div>
<dl class="facts">
<dt>Number</dt><dd>${escape(q.number)}</dd>
<dt>Date</dt><dd>${longDate(q.date)}</dd>
<dt>Valid until</dt><dd>${longDate(q.validUntil)}</dd>
<dt>Prepared by</dt><dd>${escape(q.preparedBy)}</dd>
</dl>
</header>
<hr class="tenant-rule">
${status === null ? "" : `<p class="notice ${status.tone}">${escape(status.text)}</p>`}
<section class="party">
<h2 class="label">Prepared for</h2>
<p class="name">${escape(q.customer.name)}</p>
<p>Account ${escape(q.customer.accountNumber)}</p>
</section>
<table class="lines">
<thead><tr><th scope="col">Item</th><th scope="col">Description</th><th scope="col" class="number">Quantity</th>
<th scope="col" class="number">List price</th><th scope="col" class="number">Discount</th>
<th scope="col" class="number">Net price</th><th scope="col" class="number">Amount</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
<table class="totals">
<tr><th scope="row">Subtotal</th><td class="number">${grouped(q.netSubtotal)}</td></tr>
<tr><th scope="row">Tax (${rate(q.taxRate)})</th><td class="number">${grouped(q.tax)}</td></tr>
<tr class="grand"><th scope="row">Total</th><td class="number">${escape(q.currency)} ${grouped(q.total)}</td></tr>
</table>
${notes}
<footer class="closing">
<p>Prices in ${escape(q.currency)}, before tax unless stated. Valid until ${longDate(q.validUntil)}.</p>
<p>${escape(q.tenant.name)}, quotation ${escape(q.number)}, issued with Pricewright.</p>
</footer>
</div>
</body>
</html>
`;
}
