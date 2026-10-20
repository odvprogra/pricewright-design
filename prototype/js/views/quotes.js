// Quotes (screen spec: docs/ux/screens/quotes.md): a list report with filters in the URL.
import { daysLeft, date, h, money, relative, statusBadge } from "../format.js";
import { currentUser, customer, demo, nextNumber, save, state, today } from "../store.js";

const OPEN = new Set(["draft", "pending_approval", "approved", "sent"]);
const PAGE = 50;

function filters() {
  const query = new URLSearchParams(location.hash.split("?")[1] ?? "");
  return {
    status: query.get("status") ?? "",
    mine: query.get("mine") === "1",
    shown: Number(query.get("shown") ?? PAGE),
  };
}

/** @param {import("../store.js").Quote} q */
function row(q) {
  const c = customer(q.customer_id);
  const left = daysLeft(q.valid_until);
  const validity = OPEN.has(q.status)
    ? `${date(q.valid_until)}${left >= 0 && left <= 7 ? `<br><span class="muted">Expires in ${left} days</span>` : ""}`
    : `<span class="muted">${date(q.valid_until)}</span>`;
  return `<tr>
<td><a href="#/quotes/${q.id}">${h(q.number)}</a></td>
<td>${h(c.name)}<br><span class="muted">${h(c.account_number)}</span></td>
<td>${statusBadge(q.status)}</td>
<td class="number">${money(q.total)}</td>
<td>${validity}</td>
<td>${h(q.created_by)}</td>
<td>${relative(q.status_changed_at ?? q.created_at)}</td>
</tr>`;
}

/** The customer picker that starts a quote. */
function newQuoteDialog() {
  return `<dialog id="new-quote" aria-labelledby="new-quote-title">
<form method="dialog" id="new-quote-form">
<h2 id="new-quote-title">New quote</h2>
<div class="field"><label for="new-quote-customer">Customer</label>
<input id="new-quote-customer" list="customer-options" autocomplete="off" placeholder="Name or account number">
<datalist id="customer-options">${demo.customers
    .filter((c) => c.is_active)
    .map((c) => `<option value="${h(c.account_number)} · ${h(c.name)}"></option>`)
    .join("")}</datalist></div>
<p id="new-quote-error" class="error" role="alert" hidden></p>
<div class="actions"><button type="submit" class="primary" value="start">Start quote</button>
<button type="button" class="secondary" value="cancel" id="new-quote-cancel">Cancel</button></div>
</form></dialog>`;
}

/**
 * Start a draft for a customer, as `POST /api/v1/quotes` would, and open the builder.
 * @param {string} customerId
 */
export function startQuote(customerId) {
  const user = currentUser();
  const validUntil = new Date(today().getTime() + demo.tenant.quote_validity_days * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const id = `q-${Date.now().toString(36)}`;
  state.quotes.unshift({
    id,
    number: nextNumber(),
    customer_id: customerId,
    status: "draft",
    created_by: user?.name ?? "",
    created_at: today().toISOString(),
    status_changed_at: null,
    valid_until: validUntil,
    list_subtotal: "0.00",
    net_subtotal: "0.00",
    tax: "0.00",
    total: "0.00",
    notes: null,
    lines: [],
    approvals: [],
    mine: true,
  });
  save();
  location.hash = `#/quotes/${id}`;
}

export function quotesView() {
  const { status, mine, shown } = filters();
  const user = currentUser();
  const all = state.quotes.filter(
    (q) => (status === "" || q.status === status) && (!mine || q.created_by === user?.name),
  );
  const rows = all.slice(0, shown).map(row).join("");
  const statuses = [
    "draft",
    "pending_approval",
    "approved",
    "sent",
    "accepted",
    "converted",
    "rejected",
    "cancelled",
    "expired",
    "superseded",
  ];
  const empty =
    state.quotes.length === 0
      ? `<div class="empty"><p>No quotes yet. Start one and the pricing engine will price every line.</p></div>`
      : `<div class="empty"><p>No quotes match these filters.</p><a class="button secondary" href="#/quotes">Clear filters</a></div>`;
  return {
    title: "Quotes",
    html: `<div class="page-head"><h1>Quotes</h1><button type="button" class="primary" id="new-quote-open">New quote</button></div>
<form class="filters" id="quote-filters" role="search" aria-label="Filter quotes">
<div class="field"><label for="filter-status">Status</label><select id="filter-status" name="status">
<option value="">Any status</option>${statuses.map((s) => `<option value="${s}"${s === status ? " selected" : ""}>${h(s.replace("_", " ").replace(/^./, (x) => x.toUpperCase()))}</option>`).join("")}
</select></div>
<div class="field checkbox"><input id="filter-mine" name="mine" type="checkbox"${mine ? " checked" : ""}><label for="filter-mine">Only mine</label></div>
</form>
${
  all.length === 0
    ? empty
    : `<div class="table"><table>
<thead><tr><th scope="col">Number</th><th scope="col">Customer</th><th scope="col">Status</th><th scope="col" class="number">Total</th>
<th scope="col">Valid until</th><th scope="col">Created by</th><th scope="col">Updated</th></tr></thead>
<tbody>${rows}</tbody></table></div>
<p class="muted">${Math.min(shown, all.length)} of ${all.length} quotes.</p>
${shown < all.length ? `<a class="button secondary" href="#/quotes?${new URLSearchParams({ status, mine: mine ? "1" : "", shown: String(shown + PAGE) })}">Load more</a>` : ""}`
}
${newQuoteDialog()}`,
    /** @param {HTMLElement} root */
    mount(root) {
      const form = /** @type {HTMLFormElement} */ (root.querySelector("#quote-filters"));
      form.addEventListener("change", () => {
        const data = new FormData(form);
        const query = new URLSearchParams();
        const chosen = String(data.get("status") ?? "");
        if (chosen !== "") query.set("status", chosen);
        if (data.get("mine") !== null) query.set("mine", "1");
        location.hash = `#/quotes${query.size > 0 ? `?${query}` : ""}`;
      });
      const dialog = /** @type {HTMLDialogElement} */ (root.querySelector("#new-quote"));
      const input = /** @type {HTMLInputElement} */ (root.querySelector("#new-quote-customer"));
      const error = /** @type {HTMLElement} */ (root.querySelector("#new-quote-error"));
      root.querySelector("#new-quote-open")?.addEventListener("click", () => {
        dialog.showModal();
        input.focus();
      });
      root.querySelector("#new-quote-cancel")?.addEventListener("click", () => dialog.close());
      root.querySelector("#new-quote-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const text = input.value.trim().toLowerCase();
        const match = demo.customers.find(
          (c) =>
            c.is_active &&
            (`${c.account_number} · ${c.name}`.toLowerCase() === text ||
              c.account_number.toLowerCase() === text ||
              c.name.toLowerCase() === text),
        );
        if (match === undefined) {
          error.textContent =
            "Pick a customer from the list: type part of the name or the account number.";
          error.hidden = false;
          input.focus();
          return;
        }
        dialog.close();
        startQuote(match.id);
      });
    },
  };
}
