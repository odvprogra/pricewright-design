// What the API does to a quote, for the prototype: reprice it, and move it through its lifecycle.
import { formatCents, priceLine, priceQuote } from "./pricing.js";
import { currentUser, customer, demo, product, save, today } from "./store.js";

/** @typedef {import("./store.js").Quote} Quote */

/** @param {bigint} cents */
const amount = (cents) => formatCents(cents, { grouping: false });

/**
 * Price every line again, as every line change does in the API, and refresh the totals.
 * @param {Quote} q
 */
export function reprice(q) {
  const tier = customer(q.customer_id).tier;
  const priced = q.lines.map((line) => priceLine(product(line.sku), tier, Number(line.quantity)));
  q.lines = q.lines.map((line, i) => {
    const p = /** @type {import("./pricing.js").PricedLine} */ (priced[i]);
    const item = product(line.sku);
    return {
      sku: item.sku,
      name: item.name,
      unit: item.unit,
      quantity: line.quantity,
      list_unit_price: item.list_price,
      net_unit_price: (p.netUnit < 0n ? "-" : "") + formatUnits(p.netUnit),
      net_total: amount(p.netTotal),
      below_margin_floor: p.belowMarginFloor,
      steps: p.steps,
    };
  });
  const totals = priceQuote(priced, demo.tenant);
  q.list_subtotal = amount(totals.listSubtotal);
  q.net_subtotal = amount(totals.netSubtotal);
  q.tax = amount(totals.tax);
  q.total = amount(totals.total);
  return totals;
}

/** @param {bigint} units ten-thousandths */
function formatUnits(units) {
  const abs = units < 0n ? -units : units;
  return `${abs / 10_000n}.${(abs % 10_000n).toString().padStart(4, "0")}`;
}

/** The quote's approval check, without changing it. */
export function approvalCheck(/** @type {Quote} */ q) {
  const tier = customer(q.customer_id).tier;
  const priced = q.lines.map((line) => priceLine(product(line.sku), tier, Number(line.quantity)));
  return priceQuote(priced, demo.tenant);
}

/**
 * @param {Quote} q
 * @param {string} status
 */
function move(q, status) {
  q.status = status;
  q.status_changed_at = today().toISOString();
  save();
}

/** Submit a draft: approved at once, or sent for approval with its reasons (D-36). */
export function submit(/** @type {Quote} */ q) {
  const totals = reprice(q);
  const user = currentUser();
  if (totals.requiresApproval) {
    q.approvals.push({
      status: "pending",
      requested_by: user?.name ?? "",
      requested_at: today().toISOString(),
      reasons: totals.reasons,
      discount: (Number(totals.discount) / 10_000).toFixed(4),
      decided_by: "",
      comment: null,
    });
    move(q, "pending_approval");
  } else {
    move(q, "approved");
  }
  return totals.requiresApproval;
}

/**
 * Decide on a pending approval as `decider`.
 * @param {Quote} q
 * @param {"approved" | "rejected"} decision
 * @param {string} decider
 * @param {string | null} comment
 */
export function decide(q, decision, decider, comment) {
  const request = q.approvals.at(-1);
  if (request !== undefined) {
    request.status = decision;
    request.decided_by = decider;
    request.comment = comment;
  }
  move(q, decision);
}

/** @param {Quote} q */
export function recall(q) {
  const request = q.approvals.at(-1);
  if (request !== undefined) {
    request.status = "withdrawn";
  }
  move(q, "draft");
}

/** @param {Quote} q */
export function send(q) {
  q.sent_to = customer(q.customer_id).email ?? "";
  move(q, "sent");
}

/** @param {Quote} q */
export function accept(q) {
  move(q, "accepted");
}

/** @param {Quote} q */
export function convert(q) {
  move(q, "converted");
}

/**
 * @param {Quote} q
 * @param {string} reason
 */
export function cancel(q, reason) {
  q.cancel_reason = reason;
  move(q, "cancelled");
}

const MANAGERS = new Set(["sales_manager", "admin"]);

/**
 * What the signed-in user may do with the quote now, as the API's `allowed_actions` and the roles
 * decide (screen spec: quote-detail.md).
 * @param {Quote} q
 * @returns {string[]}
 */
export function allowedActions(q) {
  const user = currentUser();
  if (user === null) {
    return [];
  }
  const manager = MANAGERS.has(user.role);
  const builtByMe = q.created_by === user.name;
  switch (q.status) {
    case "draft":
      return ["submit", "cancel"];
    case "pending_approval":
      return [...(manager && !builtByMe ? ["approve", "reject"] : []), "recall", "cancel"];
    case "approved":
      return ["send", "revise", "cancel"];
    case "sent":
      return ["accept", "revise", "cancel"];
    case "accepted":
      return ["convert"];
    case "rejected":
      return ["revise", "cancel"];
    case "expired":
      return ["revise"];
    default:
      return [];
  }
}
