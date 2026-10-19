# Voice and tone

Pricewright has one voice and many tones: the voice stays the same everywhere, the tone shifts with
the reader's situation, as Mailchimp's
[content style guide](https://styleguide.mailchimp.com/voice-and-tone/) and Shopify's
[app design guidelines](https://shopify.dev/docs/apps/design/content/voice-and-tone) separate them.

## Voice: formal and precise

- **Name things exactly.** The quote number, the customer, the rule, the amount with its currency:
  "Fastener volume pricing, 50 boxes or more, −12%", not "a volume discount".
- **Say what happened and what comes next.** "NF-2026-000132 was submitted. Morgan Reyes will decide
  on it." A message never stops at "Done".
- **Plain words, complete sentences.** No slang, no jokes, no exclamation marks; contractions are
  fine in the app ("can't", "isn't"), not in customer-facing documents.
- **The reader is busy.** The important fact first; short sentences; one idea each.
- **Never blame.** Errors say what went wrong and how to fix it; the system takes responsibility for
  its own failures.

## Tone by situation

| Situation              | Tone                            | Example                                                                                             |
| ---------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------- |
| Routine success        | Brief, factual                  | "Line added. Total 3,086.67 USD."                                                                   |
| A decision for someone | Clear about who acts next       | "Submitted for approval: 16.4% off list is above your 15% threshold."                               |
| Approval received      | Matter-of-fact                  | "Morgan Reyes approved NF-2026-000132. It's ready to send."                                         |
| Rejection received     | Neutral, puts the comment first | "Morgan Reyes asked for changes: “Bring the anchors back to 12% off.”"                              |
| Validation error       | Specific, fixable               | "List price cannot be negative."                                                                    |
| Conflict (412)         | Calm, explains, offers a way    | "Morgan Reyes changed this quote after you opened it. Reload to see the changes."                   |
| System failure         | Owns it, gives the reference    | "Pricewright couldn't save the line. Try again; if it keeps failing, give support reference 8f3c…." |
| Empty view             | Says why, offers the next step  | "There are no quotes in this view. Change the filters or start a quote."                            |
| Customer-facing email  | Formal, complete                | Subject "Quotation NF-2026-000132 from Northfield Supply"; no contractions                          |

## Words

| Use                                       | Instead of                              | Why                                                              |
| ----------------------------------------- | --------------------------------------- | ---------------------------------------------------------------- |
| quote (in the app)                        | proposal, offer, estimate               | The API's and the users' word                                    |
| quotation (in the PDF and customer email) | quote                                   | The commercial document's name in B2B paperwork                  |
| submit                                    | send for approval (when none is needed) | Submitting may approve at once; the button says which it will do |
| send (to the customer)                    | email, share                            | Matches the action and its audit event                           |
| list price, net price                     | original price, final price             | The price waterfall's terms                                      |
| discount from list                        | savings, markdown                       | The approval metric is measured from list                        |
| margin floor                              | minimum margin, margin limit            | The pricing rule's name                                          |
| archive, restore                          | delete, remove (for master data)        | Archived records keep their history                              |

## Mechanics

- **Sentence case** for titles, headings, buttons and labels: only the first word and proper nouns
  capitalized
  ([Microsoft Writing Style Guide](https://learn.microsoft.com/en-us/style-guide/capitalization)).
- **Buttons are verbs** that say what happens: "Submit for approval", "Send to customer", "Approve".
- **Money** always with its currency, two decimals, thousands separated: `3,086.67 USD` in the app,
  `USD 3,086.67` in the quotation's totals (the tenant's locale decides once there is one).
- **Dates** spelled for people ("Nov 18, 2026"), ISO 8601 only in files and the API.
- **Percentages** with one decimal when they are a result ("16.4% off list"), as configured when
  they are a rule ("−12%").
- **Quote numbers** never split or abbreviated: `NF-2026-000132-R2`.
