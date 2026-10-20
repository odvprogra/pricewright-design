// The prototype's shell: a hash router, the app bar and navigation for the signed-in role.
import { h } from "./format.js";
import { setRender, takeFocusTarget } from "./render.js";
import { currentUser, demo, load, reset, save, state } from "./store.js";
import { approvalsView } from "./views/approvals.js";
import { customersView, customerView } from "./views/customers.js";
import { moderatorView } from "./views/moderator.js";
import { quoteView } from "./views/quote.js";
import { quotesView } from "./views/quotes.js";
import { signInView } from "./views/sign-in.js";

/**
 * @typedef {{ title: string, html: string, mount?: (root: HTMLElement) => void }} View
 * @typedef {(params: Record<string, string>) => View} Route
 */

/** @type {[RegExp, Route][]} */
const ROUTES = [
  [/^#\/quotes$/, () => quotesView()],
  [/^#\/quotes\/(?<id>[\w-]+)$/, (p) => quoteView(p.id ?? "")],
  [/^#\/approvals(?:\/(?<id>[\w-]+))?$/, (p) => approvalsView(p.id)],
  [/^#\/customers$/, () => customersView()],
  [/^#\/customers\/(?<id>[\w-]+)$/, (p) => customerView(p.id ?? "")],
];

const MANAGERS = new Set(["sales_manager", "admin"]);

function navigation() {
  const user = currentUser();
  if (user === null) {
    return "";
  }
  const links = [
    ["#/quotes", "Quotes"],
    ...(MANAGERS.has(user.role) ? [["#/approvals", "Approvals"]] : []),
    ["#/customers", "Customers"],
  ];
  const here = location.hash;
  const items = links
    .map(([href, label]) => {
      const current = here.startsWith(href ?? "") ? ' aria-current="page"' : "";
      return `<a href="${href}"${current}>${label}</a>`;
    })
    .join("");
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("");
  return `<nav aria-label="Main">${items}</nav>
<div class="who"><span class="name">${h(user.name)}</span><span class="avatar" aria-hidden="true">${h(initials)}</span>
<button type="button" class="link" data-action="sign-out">Sign out</button></div>`;
}

function render() {
  const app = /** @type {HTMLElement} */ (document.getElementById("app"));
  const hash = location.hash || "#/quotes";
  if (hash.startsWith("#/moderator/")) {
    show(app, moderatorView(hash.slice("#/moderator/".length)));
    return;
  }
  if (currentUser() === null) {
    show(app, signInView());
    return;
  }
  // Filters live after "?" in the hash (#/quotes?status=sent); routes match the path only.
  const path = hash.split("?")[0] ?? hash;
  for (const [pattern, route] of ROUTES) {
    const match = pattern.exec(path);
    if (match !== null) {
      show(app, route(match.groups ?? {}));
      return;
    }
  }
  location.hash = "#/quotes";
}

/**
 * @param {HTMLElement} app
 * @param {View} view
 */
function show(app, view) {
  document.title = `${view.title} · Pricewright`;
  const signedIn = currentUser() !== null;
  app.innerHTML = `<header class="bar">
<div class="tenant"><span class="tenant-mark" aria-hidden="true"></span>${h(demo.tenant.name)}</div>
${signedIn ? navigation() : ""}
</header>
<main id="main" tabindex="-1">${view.html}</main>
<footer class="prototype-note">Prototype for usability testing: fictional data from the Northfield demo, as of
${h(demo.source.as_of)}. <img src="../logo/pricewright-mark-small.svg" alt="" width="12" height="12"> Pricewright</footer>`;
  app.querySelector('[data-action="sign-out"]')?.addEventListener("click", () => {
    state.user = null;
    save();
    location.hash = "#/quotes";
    render();
  });
  const heading = app.querySelector("h1");
  if (heading instanceof HTMLElement) {
    heading.tabIndex = -1;
  }
  view.mount?.(app);
  const selector = takeFocusTarget();
  const target = selector === null ? null : app.querySelector(selector);
  if (target instanceof HTMLElement) {
    // The view asked to keep the user where they were (a filter they changed, the next rows).
    target.focus();
    return;
  }
  // Otherwise move focus to the page, as a route change would announce it.
  heading?.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

// The skip link targets #main, which the hash router would read as an unknown route: move the
// focus instead of following the link.
document.querySelector(".skip")?.addEventListener("click", (event) => {
  event.preventDefault();
  document.getElementById("main")?.focus();
});

setRender(render);
window.addEventListener("hashchange", render);
await load();
if (new URLSearchParams(location.search).has("reset")) {
  reset();
  history.replaceState(null, "", location.pathname);
}
render();
