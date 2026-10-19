// A line's price breakdown, shared by the builder, the detail and the approval inbox.
import { h, netUnit, unitPrice } from "../format.js";

/** @typedef {import("../store.js").Line} Line */

/**
 * The waterfall of one line: list price, each step that applied, the net unit price.
 * @param {Line} line
 */
export function breakdown(line) {
  const list = Number(line.list_unit_price);
  const net = Number(line.net_unit_price);
  const off = list === 0 ? 0 : (1 - net / list) * 100;
  const steps = line.steps
    .map(
      (step) => `<li class="step"><span>${h(step.label)}</span>
<span class="rate">${step.rate === null ? "set" : `−${(Number(step.rate) * 100).toFixed(0)}%`}</span>
<span class="amount">${netUnit(step.unit_price)}</span></li>`,
    )
    .join("");
  const floor = line.below_margin_floor
    ? `<p class="notice danger">Below the margin floor: this line needs a manager's approval.</p>`
    : "";
  return `<ol class="waterfall" aria-label="How ${h(line.sku)} is priced">
<li><span>List price</span><span class="rate"></span><span class="amount">${unitPrice(line.list_unit_price)}</span></li>
${steps}
<li class="net"><span>Net unit price</span><span class="rate">${off > 0 ? `−${off.toFixed(2)}%` : ""}</span>
<span class="amount">${netUnit(line.net_unit_price)}</span></li>
</ol>${floor}`;
}
