// Links the moderator pastes in the chat (usability test script): they stand in for time passing.
import { h } from "../format.js";
import { decide } from "../quote-model.js";
import { demo, reset, save, state } from "../store.js";

/** @param {string} action */
export function moderatorView(action) {
  if (action === "approve-latest") {
    const latest = state.quotes.find((q) => q.mine === true && q.status === "pending_approval");
    const manager = demo.people.find((p) => p.role === "sales_manager");
    if (latest !== undefined && manager !== undefined) {
      decide(latest, "approved", manager.name, null);
      save();
    }
    return redirect(
      latest === undefined
        ? "There was no submitted quote to approve."
        : `${manager?.name} approved ${latest.number}.`,
    );
  }
  if (action === "reset") {
    reset();
    return redirect("The demo is as exported again.");
  }
  return redirect("Unknown moderator link.");
}

/** @param {string} text */
function redirect(text) {
  return {
    title: "Moderator",
    html: `<h1>Moderator</h1><p>${h(text)}</p><a class="button primary" href="#/quotes">Continue</a>`,
  };
}
