# Usability test 1 — plan

The first usability test of Pricewright, run on the clickable prototype before `pricewright-web` is
built (handbook §14.5). This plan follows the elements of usability.gov's test plan: scope, purpose,
schedule and location, sessions, equipment, participants, scenarios, metrics and roles
([archived page](https://cybercemetery.unt.edu/oilspill/20121006194803mp_/http://www.usability.gov/methods/test_refine/learnusa/testplan.html)).

Materials: [moderator script](script.md) (and its [Spanish version](script.es.md), the language the
sessions are held in), [questionnaires](questionnaires.md), and the [data sheets](data/README.md)
where every result is recorded. The report will be `docs/ux/usability-test-1.md`.

## Scope

The prototype on GitHub Pages at the commit named in the report: sign in, quotes, the quote builder,
quote detail, the approval inbox on a phone, and customers. Products and admin screens are not
tested.

## Purpose

| #   | Question                                                                                         | Answered by   |
| --- | ------------------------------------------------------------------------------------------------ | ------------- |
| Q1  | Can a sales rep build a 5-line quote and submit it without help?                                 | Task 2        |
| Q2  | Does the price breakdown explain a net price well enough to repeat it to a customer?             | Task 3        |
| Q3  | Is it clear, before and after submitting, whether a quote needs approval and what's next?        | Tasks 2 and 5 |
| Q4  | Can a manager find two quotes in the inbox and decide on them on a phone, with a useful comment? | Task 4        |
| Q5  | How usable does Pricewright feel overall?                                                        | SUS           |

The brief's acceptance criterion is Q1: **at least 4 of 5 participants complete task 2 without
help**.

## Schedule and location

Five sessions over about a week once the prototype is reviewed, plus one pilot session before them
that is not counted. Remote: the moderator and the participant meet on a video call; the participant
uses their own computer and, for task 4, their own phone.

## Sessions

About 40 minutes each: 5 minutes of introduction and consent, 25 of tasks, 5 of questionnaires and 5
of debrief. One participant per session, moderated, thinking aloud.

## Equipment

- Moderator: a computer with the video call (screen sharing and, with consent, recording), the
  script, a timer and the data sheets.
- Participant: a computer with a current browser and a phone that can share its screen in the same
  call. If the phone cannot share, task 4 runs in the computer's browser at phone width, and the
  report says so.
- The prototype's URL and the participant's sign-in (Taylor Brooks's demo account; the prototype
  accepts it without a real password).

## Participants

Five adults who work or have worked in sales, purchasing or a back-office role of a business that
sells to other businesses (quotes, orders, invoices), comfortable with web applications, and able to
read a simple English interface. The screener is in the [script](script.md#screener).

- **Not eligible:** anyone who has seen Pricewright's designs or repositories, or helped build them.
- **Privacy:** participants are named P1 to P5 everywhere. Nothing in this repository names them,
  their employers or their customers; recordings and consent stay with the moderator and are deleted
  after the report is written.
- **Thanks:** a thank-you of the moderator's choosing, the same for everyone.

## Scenarios

Participants play Taylor Brooks, a sales rep at Northfield Supply, then Morgan Reyes, the sales
manager. The tasks use the demo's real data and pricing rules.

| #   | Role    | Task                                                                                                                           | Success                                                                     |
| --- | ------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| 1   | Rep     | Find Stonegate Storage Centers and say what payment terms it has.                                                              | Says "Net 60" (or 60 days).                                                 |
| 2   | Rep     | Build a quote for Stonegate with the five products on the task card, and submit it.                                            | Five lines, right products and quantities, submitted.                       |
| 3   | Rep     | Stonegate asks why the sleeve anchors cost 42.38 instead of 51.23. Explain it.                                                 | Names the volume discount (50 boxes or more) and the gold account discount. |
| 4   | Manager | On your phone: approve Stonegate's quote; reject Kestrel Bay's NF-2026-000140, asking the rep to bring it within 15% off list. | Both decided; the rejection says what to change.                            |
| 5   | Rep     | Morgan approved your quote. Send it to the customer, and say who received it.                                                  | Sent; names Stonegate's purchasing email.                                   |

Task 2's card (also in the script):

| SKU      | Product                                                           | Quantity |
| -------- | ----------------------------------------------------------------- | -------- |
| FST-0063 | Zinc-Plated Sleeve Anchor, 1/2 x 3-3/4 in, Box of 25              | 60       |
| OFP-0036 | File Folders, Letter, Straight-Cut Tab, Manila, Box of 100        | 12       |
| SAF-0936 | Nitrile Disposable Gloves, 4 mil, Powder-Free, Medium, Box of 100 | 48       |
| JAN-0979 | Trash Can Liners, 55-60 gal, 1.2 mil, Black, Case of 100          | 20       |
| SAF-0829 | Safety Glasses, Indoor/Outdoor Mirror Lens, Anti-Fog, ANSI Z87.1+ | 100      |

The card gives SKUs to half of the lines and only names to the others, so both ways of finding a
product are tested: the sessions alternate which half.

## Metrics

Recorded per participant and task in the [data sheets](data/README.md), only as observed:

- **Task success:** `success` (done, no help), `assisted` (done after the moderator helped) or
  `failed` (gave up, or wrong result). Only `success` counts toward Q1.
- **Time on task:** seconds from the end of reading the task to the participant saying they are
  done.
- **Errors:** actions that move away from the goal (a wrong product, a wrong quantity left in, a
  wrong action), and whether the participant recovered.
- **SEQ** after each task: "Overall, how difficult or easy was this task?" from 1 to 7
  ([MeasuringU](https://measuringu.com/seq10/)); its historical average is about 5.5.
- **SUS** at the end, in the validated Spanish version (Sevilla-Gonzalez et al., 2020), scored to 0
  to 100. 68 is the average across products ([MeasuringU](https://measuringu.com/sus/)). With five
  participants the confidence interval is wide, and the report gives it.
- **Observations:** what participants said and did, in their words, attributed to P1–P5.

Problems found are rated with Nielsen's severity scale, 0 (not a problem) to 4 (catastrophe), from
their frequency, impact and persistence
([NN/g](https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/)).

## Roles

- **Moderator** (the maintainer): runs the sessions, keeps time and fills the data sheets.
- **Note-taker:** optional; when there is none, the recording (with consent) is used to check the
  notes.
- **Analysis:** the data sheets are the only input. The report computes the metrics from them, lists
  the problems with their severity and evidence, and the changes they caused in the prototype and
  the specs.
