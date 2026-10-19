// The app's render function, registered by app.js, so views can redraw without importing the shell.

/** @type {() => void} */
let render = () => {};

/** @param {() => void} fn */
export function setRender(fn) {
  render = fn;
}

export function rerender() {
  render();
}
