# Usability test 1 — moderator script

The sessions are held in Spanish: the moderator reads the [Spanish version](script.es.md). This
English version is the reference for the repository; both say the same.

## Before the session

- Prototype open at the commit named in the report; demo data reset (open its link with `?reset`
  once).
- Video call ready: screen sharing, recording off until consent.
- The participant's data sheet row ready in [data/tasks.csv](data/tasks.csv); a timer.
- Task cards ready to paste in the chat, one at a time.

## Screener

Asked when recruiting; a participant needs "yes" to 1–3 and "no" to 4.

1. Do you work, or have you worked, in sales, purchasing or a back office of a business that sells
   to other businesses (quotes, orders, invoices)?
2. Do you use web applications for work at least weekly?
3. Can you read a simple interface in English (buttons, menus, product names)?
4. Have you seen or helped build Pricewright?

## Introduction (5 minutes)

> Thank you for joining. I'm testing a product called Pricewright, a tool that distributors use to
> price and send quotes to their business customers. I'm testing the product, not you: there are no
> wrong answers, and anything that's hard is something we need to fix.
>
> I'll give you a few tasks. While you work, please think aloud: say what you're looking for, what
> you expect and what surprises you. I may not answer questions during a task, because I want to see
> what you'd do on your own; I'll answer them afterwards.
>
> This is a prototype: some buttons may do nothing. If that happens, tell me what you expected.
>
> May I record the screen and audio? Only I will see the recording, it is deleted after the
> analysis, and nothing that identifies you appears in the results. You can stop at any time.

Record the answer to the consent question in the data sheet before going on.

Warm-up: "What's your role, or the closest role you've had? How do you or your company prepare
quotes today?"

## Tasks (25 minutes)

For each task: paste the card, let the participant read it, start the timer when they finish
reading, stop it when they say they are done or give up. Then ask the SEQ
([questionnaires](questionnaires.md)).

**Rules for the moderator:**

- Neutral prompts only: "What are you thinking?", "What do you expect to happen?", "What are you
  looking for?"
- No help unless the participant asks twice or is stuck for 2 minutes; then give the smallest hint
  and mark the task `assisted`.
- Write down errors as they happen (wrong product, wrong quantity, wrong action) and whether the
  participant recovered.

### Task 1 — find a customer

> You are Taylor Brooks, a sales rep at Northfield Supply. A customer, Stonegate Storage Centers,
> calls you. Before you quote, check what payment terms they have.

Success: says "Net 60" or "60 days".

### Task 2 — build and submit a quote

> Stonegate wants a quote for these products. Build it and submit it.

| SKU      | Product                                                           | Quantity |
| -------- | ----------------------------------------------------------------- | -------- |
| FST-0063 | Zinc-Plated Sleeve Anchor, 1/2 x 3-3/4 in, Box of 25              | 60       |
| OFP-0036 | File Folders, Letter, Straight-Cut Tab, Manila, Box of 100        | 12       |
| SAF-0936 | Nitrile Disposable Gloves, 4 mil, Powder-Free, Medium, Box of 100 | 48       |
| JAN-0979 | Trash Can Liners, 55-60 gal, 1.2 mil, Black, Case of 100          | 20       |
| SAF-0829 | Safety Glasses, Indoor/Outdoor Mirror Lens, Anti-Fog, ANSI Z87.1+ | 100      |

Odd participants (P1, P3, P5) get the SKU column only for the first three lines; even participants
(P2, P4) for the last two. The other lines show the product name only.

Success: five lines with the right products and quantities, and the quote submitted. After the task:
"What happens to this quote now?" (Q3).

### Task 3 — explain a price

> Stonegate's buyer asks why the sleeve anchors cost 42.38 instead of the list price, 51.23. What do
> you tell them?

Success: names the volume discount (50 boxes or more) and the gold account discount.

### Task 4 — decide on a phone

Ask the participant to open the prototype's link on their phone and share its screen.

> You are now Morgan Reyes, the sales manager, between two customer visits. Several quotes wait for
> your approval. Approve Stonegate's. Reject Kestrel Bay's NF-2026-000140, which gives away more
> than the 15% you allow, and tell the rep what to change.

Success: Stonegate's NF-2026-000132 approved; NF-2026-000140 rejected with a comment that asks for a
smaller discount. Another Kestrel Bay quote waits too: deciding on that one is an error.

### Task 5 — send the approved quote

Back on the computer, as Taylor. Paste the moderator's link (the prototype's address ending in
`#/moderator/approve-latest`) in the chat: opening it approves the quote from task 2 as Morgan, as
if the participant had waited for the decision.

> Morgan approved your quote for Stonegate. Send it to the customer. Who received it?

Success: sent, and names Stonegate's purchasing email.

## Questionnaire (5 minutes)

The SUS in Spanish ([questionnaires](questionnaires.md)), answered alone; check every item has an
answer.

## Debrief (5 minutes)

1. What was the hardest part? What was the easiest?
2. Was anything different from what you expected?
3. If you used this every day, what would you change first?
4. (Answer the questions the participant asked during the tasks.)

> Thank you. Your help changes what we build next.

## After the session

Fill in the participant's rows in [data/tasks.csv](data/tasks.csv) and [data/sus.csv](data/sus.csv),
and their notes in `data/observations.md`, the same day.
