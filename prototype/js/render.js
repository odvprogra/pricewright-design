// The app's render function, registered by app.js, so views can redraw without importing the shell.

/** @type {() => void} */
let render = () => {};

/** @type {string | null} */
let focusTarget = null;

/** @param {() => void} fn */
export function setRender(fn) {
  render = fn;
}

export function rerender() {
  render();
}

/**
 * Where the next render puts the focus, instead of the page's heading: the control the user just
 * changed stays focused (WCAG 3.2.2 counts a focus change as a change of context).
 * @param {string} selector
 */
export function focusAfterRender(selector) {
  focusTarget = selector;
}

/** The pending focus target, once. */
export function takeFocusTarget() {
  const target = focusTarget;
  focusTarget = null;
  return target;
}
