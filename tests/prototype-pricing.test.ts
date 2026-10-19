/** The prototype's prices against quotes pricewright-api's engine priced (export_demo.py). */
import { readFile } from "node:fs/promises";

import fc from "fast-check";
import { beforeAll, describe, expect, it } from "vitest";

import {
  type Product,
  formatCents,
  priceLine,
  priceQuote,
  toUnits,
} from "../prototype/js/pricing.js";

interface Demo {
  tenant: { tax_rate: string; approval_threshold: string };
  products: Product[];
}

interface GoldenQuote {
  tier: string;
  lines: {
    sku: string;
    quantity: number;
    net_unit_price: string;
    list_total: string;
    net_total: string;
  }[];
  list_subtotal: string;
  net_subtotal: string;
  tax: string;
  total: string;
  discount: string;
  requires_approval: boolean;
}

let demo: Demo;
let golden: GoldenQuote[];
let bySku: Map<string, Product>;

const cents = (text: string): bigint => toUnits(text) / 100n;

beforeAll(async () => {
  demo = JSON.parse(await readFile("prototype/data/demo.json", "utf8")) as Demo;
  golden = JSON.parse(await readFile("tests/fixtures/engine-prices.json", "utf8")) as GoldenQuote[];
  bySku = new Map(demo.products.map((p) => [p.sku, p]));
});

describe("the prototype's prices", () => {
  it("match every quote the engine priced, to the cent and the approval check", () => {
    expect(golden.length).toBeGreaterThan(2000);
    for (const quote of golden) {
      const lines = quote.lines.map((line) => {
        const product = bySku.get(line.sku);
        if (product === undefined) {
          throw new Error(`no product ${line.sku}`);
        }
        const priced = priceLine(product, quote.tier, line.quantity);
        expect(priced.netUnit, line.sku).toBe(toUnits(line.net_unit_price));
        expect(priced.listTotal, line.sku).toBe(cents(line.list_total));
        expect(priced.netTotal, line.sku).toBe(cents(line.net_total));
        return priced;
      });
      const totals = priceQuote(lines, demo.tenant);

      expect(totals.listSubtotal).toBe(cents(quote.list_subtotal));
      expect(totals.netSubtotal).toBe(cents(quote.net_subtotal));
      expect(totals.tax).toBe(cents(quote.tax));
      expect(totals.total).toBe(cents(quote.total));
      expect(totals.discount).toBe(toUnits(quote.discount));
      expect(totals.requiresApproval).toBe(quote.requires_approval);
    }
  });

  it("include task 2's quote: 5,186.19 USD, 16.4% off list, needing approval", () => {
    const quote = golden.find((q) => q.lines.length === 5 && q.lines[0]?.sku === "FST-0063");

    expect(quote).toMatchObject({ total: "5186.19", discount: "0.1641", requires_approval: true });
  });
});

describe("formatCents", () => {
  it("groups thousands and keeps two places", () => {
    expect(formatCents(518619n)).toBe("5,186.19");
    expect(formatCents(5n)).toBe("0.05");
    expect(formatCents(-123456789n)).toBe("-1,234,567.89");
  });

  it("reads back what toUnits parsed", () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 0n, max: 10n ** 12n }), (value) => {
        return cents(formatCents(value, { grouping: false })) === value;
      }),
    );
  });
});
