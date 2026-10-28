// Formatting and small DOM helpers, so every view shows money, dates and states the same way.
import { formatCents, toUnits } from "./pricing.js";
import { demo, today } from "./store.js";

/**
 * Escape text for HTML.
 * @param {unknown} value
 */
export function h(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * A stored amount ("3086.67") with its currency: "3,086.67 USD".
 * @param {string} amount
 */
export function money(amount) {
  return `${formatCents(toUnits(amount) / 100n)} ${demo.tenant.currency}`;
}

/**
 * Cents with the currency.
 * @param {bigint} cents
 */
export function moneyCents(cents) {
  return `${formatCents(cents)} ${demo.tenant.currency}`;
}

/**
 * A unit price to four places only when it has them: "42.3775", "51.23".
 * @param {string} amount
 */
export function unitPrice(amount) {
  const [whole = "0", fraction = ""] = amount.split(".");
  const trimmed = fraction.replace(/0+$/, "").padEnd(2, "0");
  return `${Number(whole).toLocaleString("en-US")}.${trimmed}`;
}

/**
 * A net unit price always to four places, as the API stores it, so a column lines up: "14.6110".
 * @param {string} amount
 */
export function netUnit(amount) {
  const [whole = "0", fraction = ""] = amount.split(".");
  return `${Number(whole).toLocaleString("en-US")}.${fraction.padEnd(4, "0").slice(0, 4)}`;
}

const DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const DATE_TIME = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

/** @param {string} iso a date ("2026-11-18") or an instant */
export function date(iso) {
  return DATE.format(new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso));
}

/**
 * "3 days ago", with the absolute time for a tooltip.
 * @param {string | null} iso
 */
export function relative(iso) {
  if (iso === null) {
    return "";
  }
  const then = new Date(iso);
  const days = Math.round((today().getTime() - then.getTime()) / 86_400_000);
  const text =
    days <= 0 ? "Today" : days === 1 ? "Yesterday" : days < 30 ? `${days} days ago` : date(iso);
  return `<time datetime="${h(iso)}" title="${h(DATE_TIME.format(then))}">${h(text)}</time>`;
}

/** @param {string} validUntil */
export function daysLeft(validUntil) {
  return Math.round(
    (new Date(`${validUntil}T12:00:00Z`).getTime() - today().getTime()) / 86_400_000,
  );
}

const STATUS = {
  draft: ["Draft", "neutral"],
  pending_approval: ["Pending approval", "warning"],
  approved: ["Approved", "success"],
  sent: ["Sent", "info"],
  accepted: ["Accepted", "success"],
  converted: ["Converted", "success"],
  rejected: ["Rejected", "danger"],
  cancelled: ["Cancelled", "neutral"],
  expired: ["Expired", "danger"],
  superseded: ["Superseded", "neutral"],
};

/** @param {string} status */
export function statusBadge(status) {
  const [label, tone] = STATUS[/** @type {keyof typeof STATUS} */ (status)] ?? [status, "neutral"];
  return `<span class="badge ${tone}">${h(label)}</span>`;
}

/** @param {number} days */
export function terms(days) {
  return days === 0 ? "Due on receipt" : `Net ${days}`;
}

const TIERS = { standard: "Standard", silver: "Silver", gold: "Gold" };

/** @param {string} tier */
export function tierName(tier) {
  return TIERS[/** @type {keyof typeof TIERS} */ (tier)] ?? tier;
}

const UNITS = {
  EA: "Each",
  PR: "Pair",
  DZN: "Dozen",
  SET: "Set",
  XBG: "Bag",
  XBX: "Box",
  XBE: "Bundle",
  XCT: "Carton",
  XCS: "Case",
  XPK: "Pack",
  XPA: "Packet",
  XPL: "Pail",
  XRO: "Roll",
};

/** UN/ECE codes the prototype knows by name; others as they are (screen spec, Products). */
export function unitName(/** @type {string} */ code) {
  return UNITS[/** @type {keyof typeof UNITS} */ (code)] ?? code;
}

/**
 * A percentage from a stored ratio, to one decimal unless whole: "0.1641" is "16.4%", "0.15" "15%".
 * @param {string} ratio
 */
export function percent(ratio) {
  return `${(Number(ratio) * 100).toFixed(1).replace(/\.0$/, "")}%`;
}

const LIVE = () => document.getElementById("live");

/** @type {string[]} */
let queued = [];
let timer = 0;

/**
 * Tell assistive technology what changed, politely, through the page's one live region (#live in
 * index.html, which no render replaces): a live region drawn with a re-render is not announced.
 * Messages from one action are read together, in order, instead of the last replacing the others.
 * @param {string} message
 */
export function announce(message) {
  const live = LIVE();
  if (live === null) {
    return;
  }
  queued.push(message);
  live.textContent = "";
  window.clearTimeout(timer);
  // After the render that caused it, so the message follows the new focus instead of being cut.
  timer = window.setTimeout(() => {
    live.textContent = queued.join(" ");
    queued = [];
  }, 100);
}
