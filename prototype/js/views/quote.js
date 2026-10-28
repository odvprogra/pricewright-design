// A quote: the builder while it is the user's draft (quote-builder.md), the detail otherwise
// (quote-detail.md). Actions follow the API's lifecycle and roles.
import {
  announce,
  date,
  daysLeft,
  h,
  money,
  percent,
  netUnit,
  relative,
  statusBadge,
  terms,
  tierName,
  unitName,
  unitPrice,
} from "../format.js";
import {
  approvalCheck,
  accept,
  allowedActions,
  cancel,
  convert,
  decide,
  recall,
  reprice,
  send,
  submit,
} from "../quote-model.js";
import { currentUser, customer, demo, product, quote, save } from "../store.js";
import { breakdown } from "./breakdown.js";
import { focusAfterRender, rerender } from "../render.js";

/** @typedef {import("../store.js").Quote} Quote */

const notice = { text: "", tone: "success" };

/**
 * A one-time message for the next render of the quote ("Submitted. Waiting for approval.").
 * @param {string} text
 * @param {string} [tone]
 */
export function flash(text, tone = "success") {
  notice.text = text;
  notice.tone = tone;
}

function takeNotice() {
  if (notice.text === "") {
    return "";
  }
  // Drawn with the render, so it is not a live region itself: #live reads it.
  const html = `<p class="notice ${notice.tone}">${h(notice.text)}</p>`;
  announce(notice.text);
  notice.text = "";
  return html;
}

/** @param {Quote} q */
function header(q) {
  const c = customer(q.customer_id);
  const left = daysLeft(q.valid_until);
  return `<div class="page-head quote-head">
<div><p class="eyebrow">${h(q.number)}</p><h1>${h(c.name)}</h1>
<p class="muted">${h(c.account_number)} · ${tierName(c.tier)} account · ${terms(c.payment_terms_days)} · ${h(q.created_by)}</p></div>
<div class="quote-status">${statusBadge(q.status)}<span class="muted">Valid until ${date(q.valid_until)}${left >= 0 && left <= 7 && q.status !== "draft" ? ` · expires in ${left} days` : ""}</span></div>
</div>`;
}

/** @param {Quote} q */
function totals(q) {
  const discount =
    Number(q.list_subtotal) === 0 ? 0 : 1 - Number(q.net_subtotal) / Number(q.list_subtotal);
  return `<dl class="totals">
<div><dt>List subtotal</dt><dd>${money(q.list_subtotal)}</dd></div>
<div><dt>Net subtotal <span class="muted">${(discount * 100).toFixed(1)}% off list</span></dt><dd>${money(q.net_subtotal)}</dd></div>
<div><dt>Tax <span class="muted">${(Number(demo.tenant.tax_rate) * 100).toFixed(2)}%</span></dt><dd>${money(q.tax)}</dd></div>
<div class="grand"><dt>Total</dt><dd>${money(q.total)}</dd></div>
</dl>`;
}

/** @param {Quote} q */
function approvalNote(q) {
  const check = approvalCheck(q);
  const threshold = percent(demo.tenant.approval_threshold);
  const off = `${(Number(check.discount) / 100).toFixed(1)}%`;
  if (q.lines.length === 0) {
    return "";
  }
  if (check.requiresApproval) {
    const reasons = [
      ...(check.reasons.includes("discount_above_threshold")
        ? [`${off} off list is above your ${threshold} threshold`]
        : []),
      ...(check.reasons.includes("line_below_margin_floor")
        ? ["a line is below the margin floor"]
        : []),
    ];
    return `<p class="notice warning" id="approval-check">Needs approval: ${h(reasons.join(", and "))}. Submitting sends it to a manager.</p>`;
  }
  return `<p class="notice info" id="approval-check">${off} off list is within your ${threshold} threshold: submitting approves it at once.</p>`;
}

/**
 * @param {Quote} q
 * @param {number | null} selected
 */
function builder(q, selected) {
  const rows = q.lines
    .map(
      (line, i) => `<tr class="${i === selected ? "selected" : ""}" data-line="${i}">
<td><span class="sku">${h(line.sku)}</span>${h(line.name)}</td>
<td class="number"><label class="visually-hidden" for="qty-${i}">Quantity of ${h(line.sku)}</label>
<input class="qty" id="qty-${i}" data-line="${i}" inputmode="numeric" value="${h(line.quantity)}" size="5"></td>
<td>${h(unitName(line.unit))}</td>
<td class="number">${unitPrice(line.list_unit_price)}</td>
<td class="number">${netUnit(line.net_unit_price)}${line.below_margin_floor ? ' <span class="badge danger">Below floor</span>' : ""}</td>
<td class="number">${money(line.net_total)}</td>
<td><span class="row-actions"><button type="button" class="link" id="why-${i}" data-why="${i}" aria-pressed="${i === selected}">Why this price</button>
<button type="button" class="link danger" data-remove="${i}">Remove<span class="visually-hidden"> ${h(line.sku)}</span></button></span></td>
</tr>`,
    )
    .join("");
  const chosen = selected === null ? undefined : q.lines[selected];
  const why =
    chosen === undefined
      ? `<p class="muted">Choose “Why this price” on a line to see each discount the engine applied.</p>`
      : `<h2 class="panel-title">Why ${h(chosen.sku)} costs ${netUnit(chosen.net_unit_price)}</h2>${breakdown(chosen)}`;
  const check = approvalCheck(q);
  return `${header(q)}
${takeNotice()}
<div class="builder">
<section class="lines" aria-labelledby="lines-title">
<h2 id="lines-title" class="visually-hidden">Lines</h2>
<div class="lines-box">
<div class="table"><table>
<thead><tr><th scope="col">Product</th><th scope="col" class="number">Qty</th><th scope="col">Unit</th>
<th scope="col" class="number">List</th><th scope="col" class="number">Net unit</th><th scope="col" class="number">Line total</th><th scope="col"><span class="visually-hidden">Actions</span></th></tr></thead>
<tbody>${rows}</tbody></table></div>
<form id="add-line" class="add-line" autocomplete="off">
<div class="field combobox"><label for="line-product">Add a product</label>
<input id="line-product" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="line-options" placeholder="SKU or product name">
<ul id="line-options" role="listbox" aria-label="Matching products" hidden></ul></div>
<div class="field"><label for="line-quantity">Quantity</label><input id="line-quantity" inputmode="numeric" value="1" size="5"></div>
<button type="submit" class="secondary">Add line</button>
${q.lines.length === 0 ? '<p class="muted hint">Type a SKU or product name to add the first line.</p>' : ""}
</form>
</div>
<p id="undo" class="toast" hidden></p>
</section>
<aside class="side">
<section class="panel">${why}</section>
<section class="panel summary" aria-labelledby="summary-title">
<h2 id="summary-title" class="panel-title">Summary</h2>
${totals(q)}
${approvalNote(q)}
<form id="terms" class="terms">
<div class="field"><label for="valid-until">Valid until</label><input id="valid-until" type="date" value="${h(q.valid_until)}"></div>
<div class="field"><label for="notes">Notes for the customer</label><textarea id="notes" rows="2">${h(q.notes ?? "")}</textarea></div>
</form>
<div class="actions">
<button type="button" class="primary" id="submit"${q.lines.length === 0 ? " disabled" : ""}>${check.requiresApproval ? "Submit for approval" : "Submit"}</button>
<button type="button" class="secondary" id="cancel-draft">Cancel draft</button>
</div>
</section>
</aside>
</div>
${cancelDialog(q.number)}`;
}

/** @param {Quote} q */
function detail(q) {
  const actions = allowedActions(q);
  const c = customer(q.customer_id);
  const user = currentUser();
  const pending = q.approvals.at(-1);
  const banner =
    q.status === "pending_approval" && pending !== undefined
      ? `<p class="notice warning">Waiting for a manager: ${percent(pending.discount)} off list is above the ${percent(demo.tenant.approval_threshold)} threshold. Requested by ${h(pending.requested_by)} ${relative(pending.requested_at)}.</p>`
      : q.status === "expired"
        ? `<p class="notice danger">This offer expired on ${date(q.valid_until)}. Revise it to offer it again.</p>`
        : q.status === "rejected" && pending !== undefined
          ? `<p class="notice danger">${h(pending.decided_by)} asked for changes: “${h(pending.comment ?? "")}”</p>`
          : "";
  const buttons = [
    actions.includes("send")
      ? `<button type="button" class="primary" data-act="send">Send to customer</button>`
      : "",
    actions.includes("approve")
      ? `<button type="button" class="primary" data-act="approve">Approve</button>`
      : "",
    actions.includes("reject")
      ? `<button type="button" class="secondary" data-act="reject">Reject with a comment</button>`
      : "",
    actions.includes("accept")
      ? `<button type="button" class="primary" data-act="accept">Record acceptance</button>`
      : "",
    actions.includes("convert")
      ? `<button type="button" class="primary" data-act="convert">Convert to order</button>`
      : "",
    actions.includes("recall") && pending?.requested_by === user?.name
      ? `<button type="button" class="secondary" data-act="recall">Recall</button>`
      : "",
    actions.includes("revise")
      ? `<button type="button" class="secondary" data-act="revise">Revise</button>`
      : "",
    actions.includes("cancel")
      ? `<button type="button" class="link danger" data-act="cancel">Cancel quote</button>`
      : "",
  ].join("");
  const lines = q.lines
    .map(
      (
        line,
      ) => `<details class="line"><summary><span class="sku">${h(line.sku)}</span><span class="name">${h(line.name)}</span>
<span class="qty">${h(line.quantity)} × ${netUnit(line.net_unit_price)}</span><span class="amount">${money(line.net_total)}</span></summary>
${breakdown(line)}</details>`,
    )
    .join("");
  const history = q.approvals
    .map(
      (
        a,
      ) => `<li><b>${h(a.status.replace("_", " "))}</b> · requested by ${h(a.requested_by)} ${relative(a.requested_at)}
${a.decided_by !== "" ? ` · decided by ${h(a.decided_by)}` : ""}${a.comment ? ` · “${h(a.comment)}”` : ""}</li>`,
    )
    .join("");
  return `${header(q)}
${takeNotice()}
${banner}
<div class="actions detail-actions">${buttons}</div>
<div class="detail">
<section aria-labelledby="detail-lines"><h2 id="detail-lines">Lines</h2>
<p class="muted">Open a line to see why it costs what it costs.</p>
<div class="lines-list">${lines}</div></section>
<aside class="side">
<section class="panel"><h2 class="panel-title">Totals</h2>${totals(q)}</section>
${q.sent_to ? `<section class="panel"><h2 class="panel-title">Sent</h2><p>To <b>${h(q.sent_to)}</b>; replies go to ${h(q.created_by)}.</p></section>` : ""}
${history === "" ? "" : `<section class="panel"><h2 class="panel-title">Approvals</h2><ul class="history">${history}</ul></section>`}
</aside>
</div>
${dialogs(c.email, q.number)}`;
}

/**
 * @param {string | null} email
 * @param {string} number
 */
function dialogs(email, number) {
  const recipient =
    email === null
      ? `<p class="notice warning">This customer has no email on file. Sending marks the quote as sent; deliver the PDF yourself.</p>`
      : `<p>The customer receives the quotation as a PDF at <b>${h(email)}</b>. Replies come back to you.</p>`;
  return `<dialog id="send-dialog" aria-labelledby="send-title"><form method="dialog">
<h2 id="send-title">Send to customer?</h2>${recipient}
<div class="actions"><button class="primary" value="confirm">Send to customer</button><button class="secondary" value="cancel" autofocus>Keep it</button></div>
</form></dialog>
<dialog id="reject-dialog" aria-labelledby="reject-title"><form method="dialog" id="reject-form">
<h2 id="reject-title">Reject this quote?</h2>
<div class="field"><label for="reject-comment">What should change? (required)</label>
<textarea id="reject-comment" rows="3" placeholder="Say what to change so the quote can be approved."></textarea></div>
<p id="reject-error" class="error" role="alert" hidden></p>
<div class="actions"><button class="primary" value="confirm">Reject</button><button class="secondary" value="cancel" formnovalidate>Keep it pending</button></div>
</form></dialog>
${cancelDialog(number)}`;
}

/**
 * Cancelling asks for a reason, on a draft as on a quote already in the lifecycle.
 * @param {string} number
 */
function cancelDialog(number) {
  return `<dialog id="cancel-dialog" aria-labelledby="cancel-title"><form method="dialog" id="cancel-form">
<h2 id="cancel-title">Cancel ${h(number)} for good?</h2>
<div class="field"><label for="cancel-reason">Reason (required)</label><input id="cancel-reason"></div>
<p id="cancel-error" class="error" role="alert" hidden></p>
<div class="actions"><button class="primary danger" value="confirm">Cancel quote</button><button class="secondary" value="cancel">Keep it</button></div>
</form></dialog>`;
}

/**
 * @param {string} query
 */
function matches(query) {
  const text = query.trim().toLowerCase();
  if (text === "") {
    return [];
  }
  return demo.products
    .filter(
      (p) =>
        p.is_active &&
        (p.sku.toLowerCase().startsWith(text) || p.name.toLowerCase().includes(text)),
    )
    .slice(0, 8);
}

/** @param {string} id */
export function quoteView(id) {
  const q = quote(id);
  if (q === null) {
    return {
      title: "Not found",
      html: `<h1>Quote not found</h1><p>This quote doesn't exist or isn't yours to see.</p><a class="button secondary" href="#/quotes">Back to quotes</a>`,
    };
  }
  const editing = q.status === "draft" && q.created_by === currentUser()?.name;
  let selected = editing && q.lines.length > 0 ? q.lines.length - 1 : null;
  return {
    title: q.number,
    html: editing ? builder(q, selected) : detail(q),
    /** @param {HTMLElement} root */
    mount(root) {
      if (editing) {
        if (q.lines.length === 0) focusAfterRender("#line-product");
        mountBuilder(
          root,
          q,
          () => selected,
          (i) => (selected = i),
        );
      } else {
        mountDetail(root, q);
      }
    },
  };
}

/**
 * @param {HTMLElement} root
 * @param {Quote} q
 * @param {() => number | null} getSelected
 * @param {(i: number | null) => void} setSelected
 */
function mountBuilder(root, q, getSelected, setSelected) {
  const refresh = (/** @type {string} */ focusId) => {
    const before = q.total;
    reprice(q);
    save();
    const main = /** @type {HTMLElement} */ (root.querySelector("main"));
    main.innerHTML = builder(q, getSelected());
    mountBuilder(root, q, getSelected, setSelected);
    // Only a new total is news; opening a line's breakdown changes nothing.
    if (q.total !== before) announce(`Total ${money(q.total)}`);
    const target = root.querySelector(`#${focusId}`);
    if (target instanceof HTMLElement) target.focus();
  };
  const input = /** @type {HTMLInputElement} */ (root.querySelector("#line-product"));
  const list = /** @type {HTMLUListElement} */ (root.querySelector("#line-options"));
  const quantity = /** @type {HTMLInputElement} */ (root.querySelector("#line-quantity"));
  /** @type {string | null} */
  let picked = null;
  let active = -1;
  let matchesTimer = 0;
  // While typing, the focus stays in the field (no aria-activedescendant): the options are redrawn
  // on every key, and NVDA read each new option before it had a name. Down Arrow then moves into
  // the list, first to the highlighted option (ARIA APG combobox, list autocomplete).
  const showOptions = () => {
    const found = matches(input.value);
    active = found.length > 0 ? 0 : -1;
    window.clearTimeout(matchesTimer);
    // How many match, once typing pauses, as GOV.UK's accessible-autocomplete says it (1.4 s).
    matchesTimer = window.setTimeout(() => {
      const first = found[0];
      announce(
        first === undefined
          ? "No products match."
          : `${found.length} ${found.length === 1 ? "product matches" : "products match"}. ${first.sku} ${first.name}, 1 of ${found.length}, is highlighted.`,
      );
    }, 1400);
    list.innerHTML = found
      .map(
        (p, i) =>
          `<li role="option" id="opt-${i}" data-sku="${h(p.sku)}"${i === active ? ' class="active"' : ""} aria-selected="false"><span class="sku">${h(p.sku)}</span> ${h(p.name)}</li>`,
      )
      .join("");
    list.hidden = found.length === 0;
    input.setAttribute("aria-expanded", String(found.length > 0));
    input.removeAttribute("aria-activedescendant");
  };
  const choose = (/** @type {string} */ sku) => {
    picked = sku;
    const p = product(sku);
    input.value = `${p.sku} · ${p.name}`;
    window.clearTimeout(matchesTimer);
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    quantity.focus();
    quantity.select();
  };
  input.addEventListener("input", () => {
    picked = null;
    showOptions();
  });
  input.addEventListener("keydown", (event) => {
    const options = [...list.querySelectorAll("li")];
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (options.length === 0) return;
      window.clearTimeout(matchesTimer);
      // The first arrow key enters the list on the highlighted option; the next ones move.
      if (input.hasAttribute("aria-activedescendant")) {
        active = (active + (event.key === "ArrowDown" ? 1 : options.length - 1)) % options.length;
      }
      // Selected only once the list has the active descendant: Chrome reported each redrawn option
      // marked selected while typing, and NVDA read it before it had a name ("list item").
      options.forEach((o, i) => {
        o.classList.toggle("active", i === active);
        o.setAttribute("aria-selected", String(i === active));
      });
      input.setAttribute("aria-activedescendant", `opt-${active}`);
    } else if (event.key === "Enter" && !list.hidden && active >= 0) {
      event.preventDefault();
      const sku = options[active]?.dataset.sku;
      if (sku !== undefined) choose(sku);
    } else if (event.key === "Escape") {
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }
  });
  input.addEventListener("blur", () => {
    window.clearTimeout(matchesTimer);
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  });
  list.addEventListener("mousedown", (event) => {
    const option = /** @type {HTMLElement} */ (event.target).closest("li");
    if (option?.dataset.sku !== undefined) {
      event.preventDefault();
      choose(option.dataset.sku);
    }
  });
  root.querySelector("#add-line")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const sku =
      picked ??
      matches(input.value).find((p) => p.sku.toLowerCase() === input.value.trim().toLowerCase())
        ?.sku;
    const qty = Number(quantity.value);
    if (sku === undefined) {
      input.focus();
      showOptions();
      announce("Choose a product from the list first.");
      return;
    }
    if (!Number.isInteger(qty) || qty < 1) {
      quantity.focus();
      announce("Quantity must be a whole number of at least 1.");
      return;
    }
    const p = product(sku);
    q.lines.push({
      sku,
      name: p.name,
      unit: p.unit,
      quantity: String(qty),
      list_unit_price: p.list_price,
      net_unit_price: "0",
      net_total: "0",
      below_margin_floor: false,
      steps: [],
    });
    setSelected(q.lines.length - 1);
    refresh("line-product");
  });
  root.querySelectorAll("input.qty").forEach((field) => {
    const commit = () => {
      const el = /** @type {HTMLInputElement} */ (field);
      const i = Number(el.dataset.line);
      const qty = Number(el.value);
      const line = q.lines[i];
      if (line === undefined || String(qty) === line.quantity) return;
      if (!Number.isInteger(qty) || qty < 1) {
        el.setAttribute("aria-invalid", "true");
        announce("Quantity must be a whole number of at least 1.");
        return;
      }
      line.quantity = String(qty);
      setSelected(i);
      refresh(`qty-${i}`);
    };
    field.addEventListener("change", commit);
    field.addEventListener("keydown", (event) => {
      if (/** @type {KeyboardEvent} */ (event).key === "Enter") commit();
    });
  });
  root.querySelectorAll("[data-why]").forEach((button) => {
    button.addEventListener("click", () => {
      const i = Number(/** @type {HTMLElement} */ (button).dataset.why);
      setSelected(i);
      refresh(`why-${i}`);
    });
  });
  root.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      const i = Number(/** @type {HTMLElement} */ (button).dataset.remove);
      const [removed] = q.lines.splice(i, 1);
      setSelected(q.lines.length > 0 ? Math.min(i, q.lines.length - 1) : null);
      announce(`${removed?.sku ?? ""} removed. Undo is after the product search.`);
      refresh("line-product");
      const toast = /** @type {HTMLElement} */ (root.querySelector("#undo"));
      // No timer: a toast with an action stays until the next change re-renders the builder, so
      // undoing never races the clock (WCAG 2.2.1); it is two Tabs after the product search.
      toast.innerHTML = `${h(removed?.sku ?? "")} removed. <button type="button" class="link" id="undo-remove">Undo</button>`;
      toast.hidden = false;
      toast.querySelector("#undo-remove")?.addEventListener("click", () => {
        if (removed !== undefined) q.lines.splice(i, 0, removed);
        setSelected(i);
        refresh("line-product");
      });
    });
  });
  root.querySelector("#valid-until")?.addEventListener("change", (event) => {
    q.valid_until = /** @type {HTMLInputElement} */ (event.target).value;
    save();
  });
  root.querySelector("#notes")?.addEventListener("change", (event) => {
    q.notes = /** @type {HTMLTextAreaElement} */ (event.target).value;
    save();
  });
  root.querySelector("#submit")?.addEventListener("click", () => {
    const pending = submit(q);
    flash(
      pending
        ? "Submitted. A manager will decide on it; you'll get an email."
        : "Submitted and approved. It's ready to send.",
    );
    rerender();
  });
  wireCancel(root, q);
}

/**
 * @param {HTMLElement} root
 * @param {Quote} q
 */
function wireCancel(root, q) {
  const dialog = /** @type {HTMLDialogElement | null} */ (root.querySelector("#cancel-dialog"));
  const open = root.querySelector("#cancel-draft") ?? root.querySelector('[data-act="cancel"]');
  if (dialog === null || open === null) {
    return;
  }
  open.addEventListener("click", () => dialog.showModal());
  root.querySelector("#cancel-form")?.addEventListener("submit", (event) => {
    const submitter = /** @type {SubmitEvent} */ (event).submitter;
    if (/** @type {HTMLButtonElement | null} */ (submitter)?.value !== "confirm") return;
    const reason = /** @type {HTMLInputElement} */ (
      root.querySelector("#cancel-reason")
    ).value.trim();
    if (reason === "") {
      event.preventDefault();
      const error = /** @type {HTMLElement} */ (root.querySelector("#cancel-error"));
      error.textContent = "Say why the quote is cancelled; the reason stays in its history.";
      error.hidden = false;
      /** @type {HTMLElement} */ (root.querySelector("#cancel-reason")).focus();
      return;
    }
    cancel(q, reason);
    flash(`${q.number} was cancelled.`, "info");
    rerender();
  });
}

/**
 * @param {HTMLElement} root
 * @param {Quote} q
 */
function mountDetail(root, q) {
  const user = currentUser();
  const act = (/** @type {string} */ name) => root.querySelector(`[data-act="${name}"]`);
  const sendDialog = /** @type {HTMLDialogElement} */ (root.querySelector("#send-dialog"));
  act("send")?.addEventListener("click", () => sendDialog.showModal());
  sendDialog.addEventListener("close", () => {
    if (sendDialog.returnValue !== "confirm") return;
    send(q);
    const email = customer(q.customer_id).email;
    flash(
      email === null
        ? `${q.number} is marked as sent. Deliver the PDF yourself.`
        : `Sent to ${email}. Replies go to ${q.created_by}.`,
    );
    rerender();
  });
  act("approve")?.addEventListener("click", () => {
    decide(q, "approved", user?.name ?? "", null);
    flash(`Approved. ${q.created_by} will get an email.`);
    rerender();
  });
  const rejectDialog = /** @type {HTMLDialogElement} */ (root.querySelector("#reject-dialog"));
  act("reject")?.addEventListener("click", () => rejectDialog.showModal());
  root.querySelector("#reject-form")?.addEventListener("submit", (event) => {
    const submitter = /** @type {SubmitEvent} */ (event).submitter;
    if (/** @type {HTMLButtonElement | null} */ (submitter)?.value !== "confirm") return;
    const comment = /** @type {HTMLTextAreaElement} */ (
      root.querySelector("#reject-comment")
    ).value.trim();
    if (comment === "") {
      event.preventDefault();
      const error = /** @type {HTMLElement} */ (root.querySelector("#reject-error"));
      error.textContent = "Say what should change: the rep needs it to fix the quote.";
      error.hidden = false;
      /** @type {HTMLElement} */ (root.querySelector("#reject-comment")).focus();
      return;
    }
    decide(q, "rejected", user?.name ?? "", comment);
    flash(`Rejected. ${q.created_by} will get your comment by email.`, "info");
    rerender();
  });
  act("accept")?.addEventListener("click", () => {
    accept(q);
    flash(`Accepted by ${customer(q.customer_id).name}. Convert it to create the order.`);
    rerender();
  });
  act("convert")?.addEventListener("click", () => {
    convert(q);
    flash("Converted: order created with these prices and tax.");
    rerender();
  });
  act("recall")?.addEventListener("click", () => {
    recall(q);
    flash("Recalled: the quote is a draft again.", "info");
    rerender();
  });
  act("revise")?.addEventListener("click", () => {
    flash("Revising is not part of this prototype.", "info");
    rerender();
  });
  wireCancel(root, q);
}
