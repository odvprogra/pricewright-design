# Screen specs

One spec per screen of `pricewright-web`'s first release (M7), as the handbook asks (§14.5):
purpose, data, actions, the four states and permissions by role. The journeys they serve are in
[journeys.md](../journeys.md); the prototype implements them on the design tokens.

| Screen                            | Route                      | Pattern                | Main journeys |
| --------------------------------- | -------------------------- | ---------------------- | ------------- |
| [Sign in](sign-in.md)             | `/sign-in`                 | Form                   | All           |
| [Quotes](quotes.md)               | `/quotes`                  | List report            | R1–R3         |
| [Quote builder](quote-builder.md) | `/quotes/{id}` (draft)     | Object page, edit mode | R1, R2, M2    |
| [Quote detail](quote-detail.md)   | `/quotes/{id}` (otherwise) | Object page, display   | R1–R3         |

## How a spec is written

Each spec has the same sections, in this order:

1. **Purpose:** the job the screen does, in one or two sentences.
2. **Who and what they can do:** roles, the permissions that change the screen, and what an
   integration's records look like there.
3. **Pattern:** the floorplan it follows and where it was borrowed from.
4. **Data:** what is shown, in what order, and where it comes from (the API's OpenAPI contract).
5. **Actions:** what the user can do, when, and what happens.
6. **States:** loading, empty, error and success, plus the screen's own (a stale version, an expired
   offer).
7. **Layout:** desktop first at 1280 px, usable at 768 px; phone where the handbook requires it.
8. **Keyboard and accessibility:** the keyboard path and what assistive technology hears.
9. **Copy:** the strings that carry the screen, in the brand's voice.
10. **API needs:** gaps between what the screen needs and what the API offers today.

## Rules every screen follows

From handbook §14.2 and §14.3, so the specs do not repeat them:

- Filters, sort and the page cursor live in the URL, so a view can be shared.
- Money is shown with its currency, in tabular figures, as the API computed it: the UI never
  computes an amount.
- Dates are shown in the user's time zone; a relative time has the absolute one in a tooltip.
- Every mutation shows a pending state within 0.1 s. A Problem Details error becomes a human message
  plus the `request_id`; validation `errors[]` attach to their fields.
- A 412 (someone changed the record) shows what changed and offers to reload; nothing is silently
  overwritten.
- Destructive actions ask for a confirmation that names the object.
- Everything can be done with a keyboard; focus is always visible; text and controls meet WCAG 2.2
  AA.
