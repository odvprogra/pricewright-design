// The approval inbox (approval-inbox.md): a worklist, oldest first, each request led by its reason.
import { announce, h, money, percent, relative } from "../format.js";
import { decide } from "../quote-model.js";
import { rerender } from "../render.js";
import { currentUser, customer, demo, quote, state } from "../store.js";
import { breakdown } from "./breakdown.js";

/** @typedef {import("../store.js").Quote} Quote */

let message = "";

/** @param {Quote} q */
function reason(q) {
  const request = q.approvals.at(-1);
  if (request === undefined) {
    return "Needs approval";
  }
  const parts = request.reasons.map((r) =>
    r === "discount_above_threshold"
      ? `${percent(request.discount)} off list, above the ${percent(demo.tenant.approval_threshold)} threshold`
      : r === "line_below_margin_floor"
        ? "a line below the margin floor"
        : "Needs approval",
  );
  return parts.join("; ");
}

function pending() {
  return state.quotes
    .filter((q) => q.status === "pending_approval")
    .sort((a, b) =>
      (a.approvals.at(-1)?.requested_at ?? "").localeCompare(
        b.approvals.at(-1)?.requested_at ?? "",
      ),
    );
}

/**
 * @param {Quote} q
 * @param {string | undefined} selected
 */
function item(q, selected) {
  const c = customer(q.customer_id);
  const request = q.approvals.at(-1);
  return `<li><a href="#/approvals/${q.id}"${q.id === selected ? ' aria-current="true"' : ""}>
<span class="reason">${h(reason(q))}</span>
<span class="line1"><b>${h(c.name)}</b><span class="amount">${money(q.total)}</span><span class="visually-hidden">, </span></span>
<span class="line2 muted">${h(q.number)} · ${h(request?.requested_by ?? q.created_by)} · ${relative(request?.requested_at ?? null)}</span>
</a></li>`;
}

/** @param {Quote} q */
function panel(q) {
  const c = customer(q.customer_id);
  const user = currentUser();
  const own = q.created_by === user?.name;
  const lines = [...q.lines]
    .sort((a, b) => Number(b.below_margin_floor) - Number(a.below_margin_floor))
    .map(
      (
        line,
      ) => `<details class="line"><summary><span class="sku">${h(line.sku)}</span><span class="name">${h(line.name)}</span>
<span class="qty">${h(line.quantity)}</span><span class="amount">${money(line.net_total)}</span></summary>${breakdown(line)}</details>`,
    )
    .join("");
  const decision = own
    ? `<p class="notice info">You built this quote; another manager must decide on it.</p>`
    : `<form id="decision" class="decision">
<div class="field"><label for="decision-comment">Comment <span class="muted">(required to reject)</span></label>
<textarea id="decision-comment" rows="2" placeholder="Say what to change so the quote can be approved."></textarea></div>
<p id="decision-error" class="error" role="alert" hidden></p>
<div class="actions sticky"><button type="submit" class="primary" value="approve">Approve</button>
<button type="submit" class="secondary" value="reject">Reject</button></div>
</form>`;
  return `<a class="back" href="#/approvals">← All approvals</a>
<p class="eyebrow">${h(q.number)}</p>
<h2>${h(c.name)}</h2>
<p class="notice warning">${h(reason(q))}</p>
<dl class="totals">
<div><dt>List subtotal</dt><dd>${money(q.list_subtotal)}</dd></div>
<div><dt>Net subtotal</dt><dd>${money(q.net_subtotal)}</dd></div>
<div><dt>Tax</dt><dd>${money(q.tax)}</dd></div>
<div class="grand"><dt>Total</dt><dd>${money(q.total)}</dd></div>
</dl>
<details class="lines-toggle"><summary>Show ${q.lines.length} lines</summary><div class="lines-list">${lines}</div></details>
${decision}`;
}

/** @param {string | undefined} id */
export function approvalsView(id) {
  const items = pending();
  const selected = id === undefined ? undefined : quote(id);
  const shown = message;
  message = "";
  if (shown !== "") {
    // Drawn with the render, so #live reads it, as the quote's notices.
    announce(shown);
  }
  const list =
    items.length === 0
      ? `<div class="empty"><p>Nothing waits for your approval.</p></div>`
      : `<ul class="worklist" aria-label="Quotes waiting for approval">${items.map((q) => item(q, id)).join("")}</ul>`;
  const detail =
    selected === null || selected === undefined
      ? `<p class="muted pick">Choose a quote to see why it needs approval and decide on it.</p>`
      : selected.status === "pending_approval"
        ? panel(selected)
        : `<p class="notice info">${h(selected.number)} was already handled.</p><a class="back" href="#/approvals">← All approvals</a>`;
  return {
    title: "Approvals",
    html: `<div class="page-head"><h1>Approvals</h1><p class="muted">${items.length} waiting</p></div>
${shown === "" ? "" : `<p class="notice success">${h(shown)}</p>`}
<div class="inbox${selected ? " has-selection" : ""}">
<section class="inbox-list">${list}</section>
<section class="inbox-detail">${detail}</section>
</div>`,
    /** @param {HTMLElement} root */
    mount(root) {
      const form = root.querySelector("#decision");
      if (form === null || selected === null || selected === undefined) {
        return;
      }
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const choice = /** @type {HTMLButtonElement | null} */ (
          /** @type {SubmitEvent} */ (event).submitter
        )?.value;
        const comment = /** @type {HTMLTextAreaElement} */ (
          root.querySelector("#decision-comment")
        ).value.trim();
        if (choice === "reject" && comment === "") {
          const error = /** @type {HTMLElement} */ (root.querySelector("#decision-error"));
          error.textContent = "Say what should change: the rep needs it to fix the quote.";
          error.hidden = false;
          /** @type {HTMLElement} */ (root.querySelector("#decision-comment")).focus();
          return;
        }
        const user = currentUser();
        decide(
          selected,
          choice === "reject" ? "rejected" : "approved",
          user?.name ?? "",
          comment === "" ? null : comment,
        );
        message =
          choice === "reject"
            ? `Rejected ${selected.number}. ${selected.created_by} will get your comment by email.`
            : `Approved ${selected.number}. ${selected.created_by} will get an email.`;
        const next = pending()[0];
        const target = next === undefined ? "#/approvals" : `#/approvals/${next.id}`;
        // A new hash renders through hashchange; render by hand only when it stays the same.
        if (location.hash === target) {
          rerender();
        } else {
          location.hash = target;
        }
      });
    },
  };
}
