// The prototype's data: Northfield's demo as exported from pricewright-api, plus what the
// participant does in this browser, kept in sessionStorage so a reload loses nothing.

const KEY = "pricewright-prototype-v1";

/**
 * @typedef {import("./pricing.js").Product & {
 *   id: string, name: string, category: string, unit: string, unit_cost: string, is_active: boolean
 * }} Product
 * @typedef {{ id: string, account_number: string, name: string, tier: string,
 *   payment_terms_days: number, email: string | null, is_active: boolean }} Customer
 * @typedef {{ id: string, name: string, email: string, role: string }} Person
 * @typedef {{ status: string, requested_by: string, requested_at: string, reasons: string[],
 *   discount: string, decided_by: string, comment: string | null }} Approval
 * @typedef {{ sku: string, name: string, unit: string, quantity: string, list_unit_price: string,
 *   net_unit_price: string, net_total: string, below_margin_floor: boolean,
 *   steps: import("./pricing.js").Step[] }} Line
 * @typedef {{ id: string, number: string, customer_id: string, status: string, created_by: string,
 *   created_at: string, status_changed_at: string | null, valid_until: string,
 *   list_subtotal: string, net_subtotal: string, tax: string, total: string,
 *   notes: string | null, lines: Line[], approvals: Approval[], sent_to?: string,
 *   cancel_reason?: string, mine?: boolean }} Quote
 * @typedef {{ source: { as_of: string }, tenant: { name: string, currency: string, tax_rate: string,
 *   approval_threshold: string, quote_prefix: string, quote_validity_days: number },
 *   people: Person[], customers: Customer[], products: Product[], quotes: Quote[] }} Demo
 * @typedef {{ user: string | null, quotes: Quote[], drafts: Record<string, Draft> }} State
 * @typedef {{ quoteId: string, lines: { sku: string, quantity: number }[], validUntil: string,
 *   notes: string }} Draft
 */

/** @type {Demo} */
export let demo;
/** @type {State} */
export let state;

export async function load() {
  const response = await fetch("data/demo.json");
  demo = /** @type {Demo} */ (await response.json());
  let saved = null;
  try {
    saved = sessionStorage.getItem(KEY);
  } catch {
    saved = null;
  }
  state = saved === null ? fresh() : /** @type {State} */ (JSON.parse(saved));
}

/** @returns {State} */
function fresh() {
  return { user: null, quotes: structuredClone(demo.quotes), drafts: {} };
}

export function save() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private windows may refuse storage: the session still works until the tab closes.
  }
}

/** Back to the demo as exported, signed out: the moderator does this before each session. */
export function reset() {
  state = fresh();
  save();
}

/** The demo's "today": every date in the prototype is relative to it. */
export function today() {
  return new Date(`${demo.source.as_of}T12:00:00Z`);
}

/** @param {string} email */
export function personByEmail(email) {
  return demo.people.find((p) => p.email === email.trim().toLowerCase());
}

export function currentUser() {
  return demo.people.find((p) => p.id === state.user) ?? null;
}

/** @param {string} id */
export function customer(id) {
  const found = demo.customers.find((c) => c.id === id);
  if (found === undefined) {
    throw new Error(`no customer ${id}`);
  }
  return found;
}

/** @param {string} sku */
export function product(sku) {
  const found = demo.products.find((p) => p.sku === sku);
  if (found === undefined) {
    throw new Error(`no product ${sku}`);
  }
  return found;
}

/** @param {string} id */
export function quote(id) {
  return state.quotes.find((q) => q.id === id) ?? null;
}

/** The next quote number of the demo's year, as the API's series would issue it. */
export function nextNumber() {
  const year = demo.source.as_of.slice(0, 4);
  const prefix = `${demo.tenant.quote_prefix}-${year}-`;
  const last = state.quotes
    .map((q) => q.number)
    .filter((n) => n.startsWith(prefix))
    .map((n) => Number(n.slice(prefix.length, prefix.length + 6)))
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}${String(last + 1).padStart(6, "0")}`;
}
