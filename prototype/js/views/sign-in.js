// Sign in (screen spec: docs/ux/screens/sign-in.md). The prototype accepts the demo's people with
// any password; every failure gets the same message, as the API answers.
import { personByEmail, save, state } from "../store.js";

export function signInView() {
  return {
    title: "Sign in",
    html: `<section class="sign-in">
<img src="../logo/pricewright-logo.svg" alt="Pricewright" height="40">
<h1>Sign in to Pricewright</h1>
<form id="sign-in" novalidate>
<div class="field"><label for="email">Email</label>
<input id="email" name="email" type="email" autocomplete="username" required></div>
<div class="field"><label for="password">Password</label>
<input id="password" name="password" type="password" autocomplete="current-password" required></div>
<p id="sign-in-error" class="error" role="alert" hidden></p>
<button type="submit" class="primary">Sign in</button>
</form>
<p class="hint">Prototype: sign in with the email your moderator gives you; any password works.</p>
</section>`,
    /** @param {HTMLElement} root */
    mount(root) {
      const form = /** @type {HTMLFormElement} */ (root.querySelector("#sign-in"));
      const email = /** @type {HTMLInputElement} */ (root.querySelector("#email"));
      const password = /** @type {HTMLInputElement} */ (root.querySelector("#password"));
      const error = /** @type {HTMLElement} */ (root.querySelector("#sign-in-error"));
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const person = personByEmail(email.value);
        if (person === undefined || password.value === "") {
          error.textContent =
            "That email and password don't match. After several failed attempts the account locks; your admin can unlock it.";
          error.hidden = false;
          email.focus();
          return;
        }
        state.user = person.id;
        save();
        location.hash = person.role === "sales_manager" ? "#/approvals" : "#/quotes";
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });
      queueMicrotask(() => email.focus());
    },
  };
}
