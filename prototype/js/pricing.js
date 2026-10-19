// Prices for the prototype from the engine's own tables (prototype/data/demo.json, exported from
// pricewright-api). Only the arithmetic the API does after the engine is repeated here, in exact
// integers: line totals, subtotals, tax and the approval check. tests/prototype-pricing.test.ts
// checks it against quotes the engine priced.

/**
 * @typedef {{ stage: string, label: string, rate: string | null, unit_price: string }} Step
 * @typedef {{ from: string, steps: Step[], net_unit_price: string, below_margin_floor: boolean }} PriceRow
 * @typedef {{ sku: string, list_price: string, prices: Record<string, PriceRow[]> }} Product
 * @typedef {{ tax_rate: string, approval_threshold: string }} Tenant
 * @typedef {{
 *   sku: string, quantity: number, steps: Step[], belowMarginFloor: boolean,
 *   listUnit: bigint, netUnit: bigint, listTotal: bigint, netTotal: bigint
 * }} PricedLine
 */

const SCALE = 10_000n; // amounts and rates to four places, as the API stores them

/**
 * "42.3775" as 423775n (ten-thousandths).
 * @param {string} text
 * @returns {bigint}
 */
export function toUnits(text) {
  const negative = text.startsWith("-");
  const [whole = "0", fraction = ""] = (negative ? text.slice(1) : text).split(".");
  const value = BigInt(whole) * SCALE + BigInt(fraction.padEnd(4, "0").slice(0, 4));
  return negative ? -value : value;
}

/**
 * a / b rounded half up (ties away from zero), for integers.
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
function divideHalfUp(a, b) {
  const negative = a < 0n !== b < 0n;
  const [n, d] = [a < 0n ? -a : a, b < 0n ? -b : b];
  const q = (2n * n + d) / (2n * d);
  return negative ? -q : q;
}

/**
 * Cents as "1,234.56" (no currency); the UI adds it.
 * @param {bigint} cents
 * @param {{ grouping?: boolean }} [options]
 * @returns {string}
 */
export function formatCents(cents, { grouping = true } = {}) {
  const negative = cents < 0n;
  const abs = negative ? -cents : cents;
  const whole = (abs / 100n).toString();
  const grouped = grouping ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : whole;
  return `${negative ? "-" : ""}${grouped}.${(abs % 100n).toString().padStart(2, "0")}`;
}

/**
 * The price row of a product for a tier and quantity: the last bracket that starts at or below it.
 * @param {Product} product
 * @param {string} tier
 * @param {number} quantity
 * @returns {PriceRow}
 */
export function priceRow(product, tier, quantity) {
  const rows = product.prices[tier];
  if (rows === undefined || rows.length === 0) {
    throw new Error(`no prices for ${product.sku} at tier ${tier}`);
  }
  let chosen = rows[0];
  for (const row of rows) {
    if (Number(row.from) <= quantity) {
      chosen = row;
    }
  }
  return /** @type {PriceRow} */ (chosen);
}

/**
 * One line, priced: the engine's steps and unit price, totals rounded to cents half up.
 * @param {Product} product
 * @param {string} tier
 * @param {number} quantity a whole number of units
 * @returns {PricedLine}
 */
export function priceLine(product, tier, quantity) {
  const row = priceRow(product, tier, quantity);
  const q = BigInt(quantity);
  return {
    sku: product.sku,
    quantity,
    steps: row.steps,
    belowMarginFloor: row.below_margin_floor,
    listUnit: toUnits(product.list_price),
    netUnit: toUnits(row.net_unit_price),
    listTotal: divideHalfUp(toUnits(product.list_price) * q, 100n),
    netTotal: divideHalfUp(toUnits(row.net_unit_price) * q, 100n),
  };
}

/**
 * A quote's totals and approval check, as the API computes them from its priced lines.
 * @param {PricedLine[]} lines
 * @param {Tenant} tenant
 */
export function priceQuote(lines, tenant) {
  const listSubtotal = lines.reduce((sum, line) => sum + line.listTotal, 0n);
  const netSubtotal = lines.reduce((sum, line) => sum + line.netTotal, 0n);
  const taxRate = toUnits(tenant.tax_rate);
  const threshold = toUnits(tenant.approval_threshold);
  const tax = divideHalfUp(netSubtotal * taxRate, SCALE);
  const discount =
    listSubtotal === 0n ? 0n : divideHalfUp((listSubtotal - netSubtotal) * SCALE, listSubtotal);
  // Exact, as the engine: above the threshold when net < list x (1 - threshold).
  const aboveThreshold = netSubtotal * SCALE < listSubtotal * (SCALE - threshold);
  const belowFloor = lines.some((line) => line.belowMarginFloor);
  const reasons = [
    ...(aboveThreshold ? ["discount_above_threshold"] : []),
    ...(belowFloor ? ["line_below_margin_floor"] : []),
  ];
  return {
    listSubtotal,
    netSubtotal,
    tax,
    total: netSubtotal + tax,
    discount,
    threshold,
    reasons,
    requiresApproval: reasons.length > 0,
  };
}

/**
 * Ten-thousandths of a ratio as a percentage with one decimal: 1641n is "16.4%".
 * @param {bigint} ratio
 * @returns {string}
 */
export function formatPercent(ratio) {
  return `${(Number(ratio) / 100).toFixed(1)}%`;
}
