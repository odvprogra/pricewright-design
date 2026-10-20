import { describe, expect, it } from "vitest";

import {
  type QuotationLine,
  grouped,
  lineDiscount,
  longDate,
  notice,
  percent,
  quantity,
  quotationHtml,
  rate,
} from "../src/documents/quotation.ts";
import { SAMPLE_NUMBER, sampleQuotation } from "../src/documents/sample.ts";

const sample = sampleQuotation();
const html = quotationHtml(sample, "tokens.css", "fonts.css");
const styles = html.slice(html.indexOf("<style>"), html.indexOf("</style>"));

function rule(selector: string): string {
  const start = styles.indexOf(`${selector} {`);
  return styles.slice(start, styles.indexOf("}", start));
}

describe("the quotation's sample", () => {
  it("is Northfield's sent quote, from the demo data", () => {
    expect(sample.number).toBe(SAMPLE_NUMBER);
    expect(sample.status).toBe("sent");
    expect(sample.tenant).toEqual({ name: "Northfield Supply", accent: "#36597a" });
    expect(sample.lines).toHaveLength(5);
  });

  it("adds up: the lines to the subtotal, the subtotal and tax to the total", () => {
    const cents = (amount: string): number => Math.round(Number(amount) * 100);
    const lines = sample.lines.reduce((sum, line) => sum + cents(line.netTotal), 0);

    expect(lines).toBe(cents(sample.netSubtotal));
    expect(cents(sample.netSubtotal) + cents(sample.tax)).toBe(cents(sample.total));
  });
});

describe("the quotation", () => {
  it("shows what pricewright-api's ADR-0027 lists", () => {
    for (const text of [
      "<h1>Quotation</h1>",
      `<dd>${SAMPLE_NUMBER}</dd>`,
      "<dt>Valid until</dt>",
      `<dd>${sample.preparedBy}</dd>`,
      sample.customer.name,
      `Account ${sample.customer.accountNumber}`,
      ...sample.lines.map((line) => `<td class="sku">${line.sku}</td>`),
      `Tax (7.25%)`,
      `USD ${grouped(sample.total)}`,
    ]) {
      expect(html).toContain(text);
    }
  });

  it("never shows a cost or a margin", () => {
    const body = html.slice(html.indexOf("<body>"));

    expect(body).not.toMatch(/cost|margin/i);
  });

  it("takes every color and size from the tokens, apart from the tenant's accent", () => {
    const literals = styles.match(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/gi) ?? [];

    expect(literals).toEqual([sample.tenant.accent]);
    expect(styles).toContain(`--color-tenant-accent: ${sample.tenant.accent};`);
    expect(styles).not.toMatch(/\dpx\b/);
  });

  it("uses the serif for its title only", () => {
    const serif = styles.split("}").filter((block) => block.includes("--font-family-heading"));

    expect(serif).toHaveLength(1);
    expect(serif[0]?.trim()).toMatch(/^h1 \{/);
  });

  it("closes the grand total with the accountant's double rule", () => {
    expect(rule(".totals .grand th, .totals .grand td")).toContain(
      "border-bottom: 3pt double var(--color-text-default);",
    );
  });

  it("draws the tenant's rule in the tenant's accent", () => {
    expect(rule(".tenant-rule")).toContain("var(--color-tenant-accent)");
    expect(html).toContain('<hr class="tenant-rule">');
  });

  it("prints on A4 with the quote's number and the page count in the footer", () => {
    expect(styles).toContain("size: A4;");
    expect(styles).toContain(`content: "${SAMPLE_NUMBER}";`);
    expect(styles).toContain('content: "Page " counter(page) " of " counter(pages);');
  });

  it("shows the tenant's logo when there is one, else its name", () => {
    expect(html).toContain('<p class="name">Northfield Supply</p>');
    expect(quotationHtml(sampleQuotation("logo.svg"), "t.css", "f.css")).toContain(
      '<img class="logo" src="logo.svg" alt="Northfield Supply">',
    );
  });

  it("escapes what people typed", () => {
    const typed = quotationHtml({ ...sample, notes: '<b>"Rush" & co</b>' }, "t.css", "f.css");

    expect(typed).toContain("&lt;b&gt;&quot;Rush&quot; &amp; co&lt;/b&gt;");
  });
});

describe("notice", () => {
  it("says a draft, a pending or a rejected quote is not an offer, as a warning", () => {
    for (const status of ["draft", "pending_approval", "rejected"]) {
      expect(notice({ status, validUntil: "2026-11-13" })).toEqual({
        text: "Draft, not an offer: prices may change until the quote is approved.",
        tone: "warning",
      });
    }
  });

  it("says when an offer expired", () => {
    expect(notice({ status: "expired", validUntil: "2026-11-13" })).toEqual({
      text: "This offer has expired: it was valid until November 13, 2026.",
      tone: "danger",
    });
  });

  it("marks cancelled and superseded quotes, and says nothing on an offer", () => {
    expect(notice({ status: "cancelled", validUntil: "2026-11-13" })?.tone).toBe("danger");
    expect(notice({ status: "superseded", validUntil: "2026-11-13" })?.tone).toBe("info");
    for (const status of ["approved", "sent", "accepted", "converted"]) {
      expect(notice({ status, validUntil: "2026-11-13" }), status).toBeNull();
    }
  });
});

describe("the quotation's formats", () => {
  const line: QuotationLine = {
    sku: "FST-1250",
    description: "Rivet",
    quantity: "83",
    unit: "XBX",
    listUnitPrice: "11.94",
    netUnitPrice: "9.8768",
    netTotal: "819.77",
  };

  it("groups amounts and keeps up to four places of a unit price", () => {
    expect(grouped("1833.29")).toBe("1,833.29");
    expect(grouped("12500")).toBe("12,500.00");
    expect(grouped("9.8768")).toBe("9.8768");
    expect(grouped("11.9400")).toBe("11.94");
    expect(grouped("16.464", 4)).toBe("16.4640");
  });

  it("aligns the net prices' column at four places", () => {
    for (const line of sample.lines) {
      expect(html).toContain(`<td class="number">${grouped(line.netUnitPrice, 4)}</td>`);
    }
    expect(html).toContain('<td class="number">16.4640</td>');
  });

  it("writes a configured rate exactly and a result to one decimal", () => {
    expect(rate("0.0725")).toBe("7.25%");
    expect(rate("0.10")).toBe("10%");
    expect(rate("1")).toBe("100%");
    expect(percent(0.173)).toBe("17.3%");
    expect(percent(0.12)).toBe("12%");
  });

  it("computes a line's discount from list, as the API does", () => {
    expect(lineDiscount(line)).toBe(0.173);
    expect(lineDiscount({ ...line, listUnitPrice: "0" })).toBe(0);
  });

  it("names the unit after the quantity, and spells dates in full", () => {
    expect(quantity(line)).toBe("83 box");
    expect(quantity({ ...line, unit: "KGM" })).toBe("83 KGM");
    expect(longDate("2026-11-13")).toBe("November 13, 2026");
    expect(longDate("2026-10-14T18:46:00+00:00")).toBe("October 14, 2026");
  });
});
