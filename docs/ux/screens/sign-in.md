# Sign in

## Purpose

Let a person of a tenant into Pricewright with their email and password, and keep them signed in
while they work.

## Who and what they can do

Every role. Service accounts never sign in here: they call the API with an API key.

## Pattern

A single-column form with the product's logo, as in most B2B products; nothing else on the page
competes with it.

## Data

- Email and password (`POST /api/v1/auth/login`).
- After signing in, the user and their tenant (`GET /api/v1/me`, `GET /api/v1/tenant`) set the
  header: the tenant's name and, from M7, its logo and accent.

## Actions

- **Sign in:** sends the form; on success, goes to the page the user asked for, or to Quotes.
- The session renews itself with the refresh token while the tab is open; signing out ends it
  (`POST /api/v1/auth/logout`).
- No "forgot password": an admin sets passwords until email invitations exist (pricewright-api
  follow-up).

## States

| State   | What the user sees                                                                                                                                                           |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial | Email field focused; the password field can be shown as text.                                                                                                                |
| Pending | The button says "Signing in…" and is disabled; the fields keep their values.                                                                                                 |
| Error   | Any failure (unknown email, wrong password, locked account) gets the same message; the API does not tell them apart, so the page cannot reveal which accounts exist (OWASP). |
| Offline | The API cannot be reached: "Pricewright can't be reached right now. Try again in a minute."                                                                                  |
| Success | Redirect; no intermediate page.                                                                                                                                              |

## Layout

Centered column, at most 24 rem wide, the same at every width; on a phone it fills the width minus
the gutter.

## Keyboard and accessibility

- Email, password, show password, sign in, in that order; Enter submits.
- `autocomplete="username"` and `autocomplete="current-password"` so password managers work.
- Errors are announced (`role="alert"`) and the focus moves to the first field with an error.

## Copy

- Title: "Sign in to Pricewright"
- Button: "Sign in"
- Error: "That email and password don't match. After several failed attempts the account locks; your
  admin can unlock it."

## API needs

None.
