# Usability test 1 — data

Everything the sessions produce, recorded by the moderator the day of each session. The report
computes every number from these files and nothing else. Participants are P1 to P5; nothing here
names them, their employers or their customers.

## tasks.csv

One row per participant and task (25 rows when complete).

| Column             | Values                                                                              |
| ------------------ | ----------------------------------------------------------------------------------- |
| `participant`      | `P1` … `P5`                                                                         |
| `task`             | `1` … `5`, as in the [plan](../plan.md#scenarios)                                   |
| `result`           | `success` (done, no help), `assisted` (done after a hint) or `failed`               |
| `seconds`          | Time on task, from the end of reading to "done" or giving up                        |
| `errors`           | Actions that moved away from the goal                                               |
| `recovered_errors` | How many of those the participant undid on their own                                |
| `seq`              | Single Ease Question, `1` (very difficult) to `7` (very easy)                       |
| `device`           | `computer`, `phone`, or `computer-at-phone-width` when task 4 could not use a phone |
| `notes`            | A short note on what happened, in English; quotes go in `observations.md`           |

## sus.csv

One row per participant: the answers to the ten SUS items, `1` to `5`, as the participant gave them
(not yet scored). Scoring is in the [questionnaires](../questionnaires.md#scoring).

## observations.md

Per participant: what they said (translated to English, the original Spanish in parentheses when it
matters), what they did, and the moderator's hints, with the task they belong to. Created with the
first session.
