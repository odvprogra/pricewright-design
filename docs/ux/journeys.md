# User journeys

One journey per goal, for each of Pricewright's three roles, written as NN/g's journey maps are
built: an actor, a scenario with expectations, phases, the actions and mindset in each phase, and
the opportunities they point to
([Journey Mapping 101](https://www.nngroup.com/articles/journey-mapping-101/)).

The actors are Northfield Supply's demo users. The actions come from what the API allows each role
(pricewright-api's brief §2 and its OpenAPI contract). The mindsets are **hypotheses** drawn from
the brief's problem statement, not quotes from research: the usability test confirms or corrects
them, and its report links the changes back here.

Every screen named in a phase gets a spec of its own in `screens/`.

## Sales rep — Taylor Brooks

Builds quotes for their accounts, sends them and turns the accepted ones into orders. Permissions:
customers, quotes (build, submit, send, accept, convert), orders, and unit costs (`costs:read`).

### R1. Build a quote and submit it

- **Scenario:** Stonegate Storage Centers, a gold account, asks for 60 boxes of sleeve anchors and a
  dozen boxes of folders by the end of the day.
- **Expectations:** the price is right the first time, without asking anyone which discount applies;
  they know before submitting whether the quote needs their manager.

| Phase             | Actions                                                                     | Mindset (hypothesis)                                  | Screen        |
| ----------------- | --------------------------------------------------------------------------- | ----------------------------------------------------- | ------------- |
| Find the customer | Searches by name or account number; opens the account                       | “Is this the Stonegate with the gold discount?”       | Customers     |
| Start the draft   | Starts a quote from the customer; validity defaults to the tenant’s 30 days | Wants to type lines, not fill a form                  | Quote builder |
| Add lines         | Adds each line by SKU or name with the keyboard; sets quantities            | “Why is this price lower than the list?”              | Quote builder |
| Check the price   | Reads a line’s breakdown: list, volume tier, customer tier, promotion, net  | Trusts the number once the steps are visible          | Quote builder |
| Submit            | Submits; the quote is approved at once or waits for approval, with why      | Needs to know what happens next and how long it takes | Quote detail  |

**Opportunities:** keyboard-first line entry; the breakdown one key away from each line; the
approval threshold shown against the quote's discount before submitting, so a pending approval is
never a surprise.

### R2. Act on the manager's decision

- **Scenario:** Morgan approved NF-2026-000132 overnight; or rejected it, asking for less on the
  anchors.
- **Expectations:** the decision reaches them without checking the app, and the next step is one
  click.

| Phase              | Actions                                                                       | Mindset (hypothesis)                           | Screen              |
| ------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------- | ------------------- |
| Hear the decision  | Reads the email: approved with the PDF, or rejected with Morgan’s comment     | Wants the outcome in the subject line          | Email (brand guide) |
| Send it (approved) | Opens the quote; sends it; the customer receives the PDF, replying to them    | “Did it actually go to the customer?”          | Quote detail        |
| Rework (rejected)  | Revises: the quote becomes revision R2, a draft priced now; changes the lines | Doesn’t want to rebuild what was already right | Quote builder       |
| Resubmit           | Submits R2; R1 stays readable as superseded                                   | Wants the history kept, but out of the way     | Quote detail        |

**Opportunities:** the rejection comment pinned above the revised draft; one primary action per
state; an explicit confirmation of who received the email.

### R3. Record the customer's answer

- **Scenario:** Stonegate signs the quote; another customer lets an offer lapse.
- **Expectations:** the order exists with the quoted prices; a lost or expired quote is closed for
  good, with the reason.

| Phase          | Actions                                                                      | Mindset (hypothesis)                         | Screen       |
| -------------- | ---------------------------------------------------------------------------- | -------------------------------------------- | ------------ |
| Accept         | Records the acceptance on the sent quote                                     | Worries about doing it twice                 | Quote detail |
| Convert        | Converts it into an order: prices and tax copied, never recomputed           | Needs the order number to tell the warehouse | Quote detail |
| Close the rest | Cancels a quote the customer declined, with a reason; revises an expired one | “Can I still save this deal?”                | Quote detail |

**Opportunities:** convert is safe to retry (the API replays it by `Idempotency-Key`), so the button
can say so; expired offers show "Revise" as their next step.

## Sales manager — Morgan Reyes

Everything a rep does, plus approving or rejecting quotes, overriding a line's price and managing
pricing rules. Approves on the go, often from a phone. Cannot approve a quote they built (four
eyes).

### M1. Decide on a quote waiting for approval

- **Scenario:** three quotes wait in the inbox between customer visits; one is NF-2026-000132 at
  16.4% off list against a 15% threshold.
- **Expectations:** sees at once why each one needs approval, decides on a phone in under a minute,
  and the rep hears about it.

| Phase            | Actions                                                                         | Mindset (hypothesis)                 | Screen         |
| ---------------- | ------------------------------------------------------------------------------- | ------------------------------------ | -------------- |
| Triage the inbox | Opens the inbox, oldest first; scans customer, rep, total, discount, reason     | “Which of these is risky?”           | Approval inbox |
| Inspect          | Opens one: discount against the threshold, lines below the margin floor, margin | Wants the reason before the detail   | Approval inbox |
| Decide           | Approves with an optional comment, or rejects saying what to change             | Doesn’t want to type much on a phone | Approval inbox |

**Opportunities:** the reason for approval as the first line of each request; the decision without
leaving the inbox; a rejection that requires a comment (the rep needs to know what to change).

### M2. Override a line's price

- **Scenario:** a strategic account gets a price the rules don't produce.
- **Expectations:** the override is visible as its own step in the breakdown, with the reason, and
  still goes through approval like any other discount.

| Phase    | Actions                                                         | Mindset (hypothesis)                 | Screen        |
| -------- | --------------------------------------------------------------- | ------------------------------------ | ------------- |
| Override | Sets the line's override with a reason on a draft               | “Will this be traceable later?”      | Quote builder |
| Review   | Sees the override as a step after the promotion, and the margin | Checks the margin floor didn’t break | Quote builder |

**Opportunities:** the override control only for managers; the margin floor warning next to the
overridden line.

## Admin — Avery Collins

Keeps the catalog, customers, users and the tenant's settings; reads the audit trail; issues API
keys for integrations.

### A1. Keep the catalog and the customers up to date

- **Scenario:** a new product line arrives; a customer moves to the gold tier.
- **Expectations:** quick search, edits that never lose someone else's change, archive instead of
  delete.

| Phase   | Actions                                                          | Mindset (hypothesis)                      | Screen              |
| ------- | ---------------------------------------------------------------- | ----------------------------------------- | ------------------- |
| Find    | Searches products by SKU or name, or customers by name or tax id | Expects results while typing              | Products, Customers |
| Edit    | Changes a price, a cost or a customer's tier; saves              | “Did someone else change this meanwhile?” | Products, Customers |
| Archive | Archives a product or customer; restores it if needed            | Afraid of breaking old quotes             | Products, Customers |

**Opportunities:** on a 412, show what changed and offer to reload (handbook §14.2); explain that
archiving keeps every past quote intact.

Pricing rules, users, tenant settings, service accounts and the audit trail stay API-only in M7,
whose brief lists the screens above; their journeys are written when they get screens.

## Sign in (every role)

Every journey starts at Sign in: email and password, a session that renews itself, and a clear
message after too many failed attempts, when an admin must unlock the account.
