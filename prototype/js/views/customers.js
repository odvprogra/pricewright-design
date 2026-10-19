// Customers (customers.md): search the list, open a customer, start a quote from it.
import { h, money, statusBadge, terms, tierName } from "../format.js";
import { demo, state } from "../store.js";
import { startQuote } from "./quotes.js";

function query() {
  return new URLSearchParams(location.hash.split("?")[1] ?? "").get("q") ?? "";
}

export function customersView() {
  const text = query().trim().toLowerCase();
  const found = demo.customers.filter(
    (c) =>
      c.is_active &&
      (text === "" ||
        c.name.toLowerCase().includes(text) ||
        c.account_number.toLowerCase().includes(text)),
  );
  const rows = found
    .map(
      (
        c,
      ) => `<tr><td><a href="#/customers/${c.id}">${h(c.name)}</a></td><td>${h(c.account_number)}</td>
<td>${tierName(c.tier)}</td><td>${terms(c.payment_terms_days)}</td><td>${c.email === null ? '<span class="muted">No email</span>' : h(c.email)}</td></tr>`,
    )
    .join("");
  return {
    title: "Customers",
    html: `<div class="page-head"><h1>Customers</h1></div>
<form class="filters" id="customer-search" role="search">
<div class="field grow"><label for="customer-q">Search</label>
<input id="customer-q" type="search" value="${h(query())}" placeholder="Name or account number"></div>
</form>
<p class="muted" id="customer-count" aria-live="polite">${found.length} ${found.length === 1 ? "customer" : "customers"}</p>
${
  found.length === 0
    ? `<div class="empty"><p>No customer matches “${h(query())}”.</p><a class="button secondary" href="#/customers">Clear search</a></div>`
    : `<div class="table"><table><thead><tr><th scope="col">Name</th><th scope="col">Account</th><th scope="col">Tier</th>
<th scope="col">Payment terms</th><th scope="col">Email</th></tr></thead><tbody>${rows}</tbody></table></div>`
}`,
    /** @param {HTMLElement} root */
    mount(root) {
      const input = /** @type {HTMLInputElement} */ (root.querySelector("#customer-q"));
      let timer = 0;
      input.addEventListener("input", () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          const value = input.value.trim();
          history.replaceState(
            null,
            "",
            `#/customers${value === "" ? "" : `?q=${encodeURIComponent(value)}`}`,
          );
          const view = customersView();
          const main = /** @type {HTMLElement} */ (root.querySelector("main"));
          main.innerHTML = view.html;
          view.mount(root);
          const again = /** @type {HTMLInputElement} */ (root.querySelector("#customer-q"));
          again.focus();
          again.setSelectionRange(again.value.length, again.value.length);
        }, 250);
      });
      root
        .querySelector("#customer-search")
        ?.addEventListener("submit", (event) => event.preventDefault());
    },
  };
}

/** @param {string} id */
export function customerView(id) {
  const c = demo.customers.find((x) => x.id === id);
  if (c === undefined) {
    return {
      title: "Not found",
      html: `<h1>Customer not found</h1><a class="button secondary" href="#/customers">Back to customers</a>`,
    };
  }
  const quotes = state.quotes.filter((q) => q.customer_id === c.id);
  const rows = quotes
    .map(
      (q) =>
        `<tr><td><a href="#/quotes/${q.id}">${h(q.number)}</a></td><td>${statusBadge(q.status)}</td><td class="number">${money(q.total)}</td></tr>`,
    )
    .join("");
  return {
    title: c.name,
    html: `<a class="back" href="#/customers">← Customers</a>
<div class="page-head"><div><p class="eyebrow">${h(c.account_number)}</p><h1>${h(c.name)}</h1></div>
<button type="button" class="primary" id="customer-new-quote">New quote</button></div>
<dl class="facts">
<div><dt>Tier</dt><dd>${tierName(c.tier)}</dd></div>
<div><dt>Payment terms</dt><dd>${terms(c.payment_terms_days)}</dd></div>
<div><dt>Email for quotes</dt><dd>${c.email === null ? "None: sent quotes reach this customer only by hand" : h(c.email)}</dd></div>
</dl>
<section aria-labelledby="customer-quotes"><h2 id="customer-quotes">Quotes</h2>
${quotes.length === 0 ? '<p class="muted">No quotes for this customer yet.</p>' : `<div class="table"><table><thead><tr><th scope="col">Number</th><th scope="col">Status</th><th scope="col" class="number">Total</th></tr></thead><tbody>${rows}</tbody></table></div>`}
</section>`,
    /** @param {HTMLElement} root */
    mount(root) {
      root.querySelector("#customer-new-quote")?.addEventListener("click", () => startQuote(c.id));
    },
  };
}
