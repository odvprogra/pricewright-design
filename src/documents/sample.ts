/**
 * The documents' specimens use Northfield's real demo data (prototype/data/demo.json, exported from
 * pricewright-api), never invented numbers.
 */
import { readFileSync } from "node:fs";

import { TENANTS } from "../tenants.ts";
import type { Quotation } from "./quotation.ts";

interface DemoLine {
  sku: string;
  name: string;
  unit: string;
  quantity: string;
  list_unit_price: string;
  net_unit_price: string;
  net_total: string;
}

interface DemoQuote {
  number: string;
  customer_id: string;
  status: string;
  created_by: string;
  created_at: string;
  valid_until: string;
  net_subtotal: string;
  tax: string;
  total: string;
  notes: string | null;
  lines: DemoLine[];
  approvals: { requested_at: string }[];
}

interface Demo {
  tenant: { name: string; currency: string; tax_rate: string };
  customers: { id: string; name: string; account_number: string }[];
  quotes: DemoQuote[];
}

const DEMO = new URL("../../prototype/data/demo.json", import.meta.url);

/** A sent quote with five lines: what a customer receives. */
export const SAMPLE_NUMBER = "NF-2026-000122";

export function sampleQuotation(logo?: string): Quotation {
  const demo = JSON.parse(readFileSync(DEMO, "utf8")) as Demo;
  const quote = demo.quotes.find((q) => q.number === SAMPLE_NUMBER);
  const customer = demo.customers.find((c) => c.id === quote?.customer_id);
  const tenant = TENANTS.find((t) => t.name === demo.tenant.name);
  if (quote === undefined || customer === undefined || tenant === undefined) {
    throw new Error(`no quote ${SAMPLE_NUMBER} with its customer and tenant in the demo data`);
  }
  return {
    tenant: { name: tenant.name, accent: tenant.accent, ...(logo === undefined ? {} : { logo }) },
    number: quote.number,
    status: quote.status,
    date: quote.approvals[0]?.requested_at ?? quote.created_at,
    validUntil: quote.valid_until,
    preparedBy: quote.created_by,
    customer: { name: customer.name, accountNumber: customer.account_number },
    currency: demo.tenant.currency,
    lines: quote.lines.map((line) => ({
      sku: line.sku,
      description: line.name,
      quantity: line.quantity,
      unit: line.unit,
      listUnitPrice: line.list_unit_price,
      netUnitPrice: line.net_unit_price,
      netTotal: line.net_total,
    })),
    netSubtotal: quote.net_subtotal,
    taxRate: demo.tenant.tax_rate,
    tax: quote.tax,
    total: quote.total,
    notes: quote.notes,
  };
}
