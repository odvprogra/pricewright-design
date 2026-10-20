/**
 * The emails' reference designs: the quotation sent to a customer and a manager's decision sent to
 * the rep (pricewright-api's ADR-0028). Mail clients drop `<style>` blocks and do not resolve
 * `var()`, so every style is inline and every value is copied from a build's `tokens.json`; layout
 * is tables marked `role="presentation"`, one column of at most 600 px, in web-safe font stacks.
 */
import { escape } from "../site/layout.ts";
import type { Quotation } from "./quotation.ts";
import { grouped, longDate } from "./quotation.ts";
import {
  APPROVED_NUMBER,
  type Decision,
  REJECTED_NUMBER,
  sampleDecision,
  sampleQuotation,
} from "./sample.ts";

/** The values an email uses, copied from the tokens and the tenant's accent. */
export interface EmailStyle {
  readonly accent: string;
  readonly text: string;
  readonly muted: string;
  readonly canvas: string;
  readonly paper: string;
  readonly border: string;
  readonly quote: string;
  readonly serif: string;
  readonly sans: string;
  /** Sizes in pixels: mail clients handle `rem` unevenly. */
  readonly size: {
    readonly xs: number;
    readonly md: number;
    readonly lg: number;
    readonly xl2: number;
  };
}

/** The tokens an email uses, by role, so a test can check each value is the token's. */
export const EMAIL_TOKENS = {
  text: "color.text.default",
  muted: "color.text.muted",
  canvas: "color.surface.muted",
  paper: "color.surface.default",
  border: "color.border.default",
  quote: "color.border.strong",
  serif: "font.family.serif",
  sans: "font.family.sans",
} as const;

const REM = 16;

/** The email's style from a build's `tokens.json` (keys like `color-text-default`). */
export function emailStyle(built: Readonly<Record<string, string>>, accent: string): EmailStyle {
  const value = (path: string): string => {
    const found = built[path.replaceAll(".", "-")];
    if (found === undefined) {
      throw new Error(`no token ${path}`);
    }
    return found;
  };
  const px = (path: string): number => Number.parseFloat(value(path)) * REM;
  const roles = Object.fromEntries(
    Object.entries(EMAIL_TOKENS).map(([role, path]) => [role, value(path)]),
  ) as Record<keyof typeof EMAIL_TOKENS, string>;
  return {
    ...roles,
    accent,
    size: {
      xs: px("font.size.xs"),
      md: px("font.size.md"),
      lg: px("font.size.lg"),
      xl2: px("font.size.2xl"),
    },
  };
}

export interface Email {
  readonly subject: string;
  /** The preview line inboxes show after the subject. */
  readonly preheader: string;
  readonly html: string;
  readonly text: string;
}

/** Attribute text: font stacks hold single quotes only, so double-quoted attributes stay valid. */
function attr(css: string): string {
  return css.replaceAll('"', "&quot;");
}

/** What an email says, once, for its HTML and its plain-text part. */
type Block =
  | { readonly kind: "paragraph"; readonly text: string }
  | { readonly kind: "comment"; readonly text: string }
  | { readonly kind: "facts"; readonly rows: readonly (readonly [string, string])[] };

function html(s: EmailStyle, block: Block): string {
  const type = `font-family:${s.sans};font-size:${s.size.md}px;line-height:1.5;color:${s.text};`;
  switch (block.kind) {
    case "paragraph":
      return `<p style="${attr(`margin:0 0 16px;${type}`)}">${escape(block.text)}</p>`;
    case "comment":
      // A manager's comment, set apart as a quotation.
      return `<blockquote style="${attr(`margin:0 0 16px;padding:8px 16px;border-left:3px solid ${s.quote};background:${s.canvas};${type}`)}">${escape(block.text)}</blockquote>`;
    case "facts": {
      // A real data table: row headers, so screen readers pair each label with its value.
      const rows = block.rows
        .map(
          ([label, value]) =>
            `<tr><th scope="row" align="left" style="${attr(`padding:4px 16px 4px 0;font-family:${s.sans};font-size:${s.size.md}px;font-weight:400;color:${s.muted};`)}">${escape(label)}</th>` +
            `<td style="${attr(`padding:4px 0;font-family:${s.sans};font-size:${s.size.md}px;font-weight:600;color:${s.text};font-variant-numeric:tabular-nums;`)}">${escape(value)}</td></tr>`,
        )
        .join("");
      return `<table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;border-collapse:collapse;">${rows}</table>`;
    }
  }
}

function text(block: Block): string {
  switch (block.kind) {
    case "paragraph":
      return block.text;
    case "comment":
      return `> ${block.text}`;
    case "facts":
      return block.rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  }
}

/** A sentence ending in a name: no second period after "Co.". */
function ending(name: string): string {
  return name.endsWith(".") ? name : `${name}.`;
}

interface Message {
  readonly tenant: string;
  readonly subject: string;
  readonly preheader: string;
  readonly heading: string;
  readonly blocks: readonly Block[];
  readonly footer: string;
}

/** The shell every email shares: canvas, a 600 px card, the tenant's rule, name, heading, footer. */
function email(s: EmailStyle, m: Message): Email {
  const cell = (css: string, content: string): string =>
    `<tr><td style="${attr(css)}">${content}</td></tr>`;
  const body = m.blocks.map((block) => html(s, block)).join("\n");
  return {
    subject: m.subject,
    preheader: m.preheader,
    html: `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escape(m.subject)}</title>
</head>
<body style="${attr(`margin:0;padding:0;background:${s.canvas};`)}">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;" aria-hidden="true">${escape(m.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${attr(`background:${s.canvas};`)}">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="${attr(`width:100%;max-width:600px;background:${s.paper};border:1px solid ${s.border};border-collapse:separate;`)}">
${cell(`height:4px;line-height:4px;font-size:0;background:${s.accent};`, "&nbsp;")}
${cell(`padding:24px 32px 0;font-family:${s.sans};font-size:${s.size.lg}px;font-weight:600;color:${s.text};`, escape(m.tenant))}
${cell("padding:16px 32px 8px;", `<h1 style="${attr(`margin:0;font-family:${s.serif};font-size:${s.size.xl2}px;font-weight:600;line-height:1.2;color:${s.text};`)}">${escape(m.heading)}</h1>`)}
${cell("padding:16px 32px 8px;", body)}
${cell(`padding:16px 32px 24px;border-top:1px solid ${s.border};font-family:${s.sans};font-size:${s.size.xs}px;line-height:1.5;color:${s.muted};`, escape(m.footer))}
</table>
</td></tr>
</table>
</body>
</html>
`,
    text: `${[...m.blocks.map(text), m.footer].join("\n\n")}\n`,
  };
}

/**
 * The quotation sent to the customer: formal, no contractions, the PDF attached. Headings carry no
 * number: Georgia, the serif stack's fallback, sets old-style figures, so numbers go in the facts.
 */
export function quoteSentEmail(s: EmailStyle, q: Quotation): Email {
  const total = `${q.currency} ${grouped(q.total)}`;
  return email(s, {
    tenant: q.tenant.name,
    subject: `Quotation ${q.number} from ${q.tenant.name}`,
    preheader: `${total}, valid until ${longDate(q.validUntil)}. The quotation is attached as a PDF.`,
    heading: `Your quotation from ${q.tenant.name}`,
    blocks: [
      { kind: "paragraph", text: "Hello," },
      {
        kind: "paragraph",
        text: `${q.preparedBy} at ${q.tenant.name} sends you a quotation for ${ending(q.customer.name)}`,
      },
      {
        kind: "facts",
        rows: [
          ["Quotation", q.number],
          ["Total", total],
          ["Valid until", longDate(q.validUntil)],
        ],
      },
      {
        kind: "paragraph",
        text: `The quotation is attached as a PDF. Reply to this email to reach ${q.preparedBy}.`,
      },
    ],
    footer: `${q.tenant.name}, sent with Pricewright.`,
  });
}

/** The three emails, from Northfield's demo data, by the name of their reference file. */
export function sampleEmails(built: Readonly<Record<string, string>>): Record<string, Email> {
  const quotation = sampleQuotation();
  const style = emailStyle(built, quotation.tenant.accent);
  return {
    "email-quote-sent": quoteSentEmail(style, quotation),
    "email-quote-approved": decisionEmail(style, sampleDecision(APPROVED_NUMBER)),
    "email-quote-rejected": decisionEmail(style, sampleDecision(REJECTED_NUMBER)),
  };
}

/** A manager's decision, to the rep, in the app's voice: who decided, then the comment. */
export function decisionEmail(s: EmailStyle, d: Decision): Email {
  const said = d.comment === null ? "" : ` “${d.comment}”`;
  const blocks: Block[] = [
    { kind: "paragraph", text: `Hi ${d.rep.split(" ")[0] ?? d.rep},` },
    {
      kind: "paragraph",
      text: d.approved
        ? `${d.decider} approved your quote for ${ending(d.customer)}`
        : `${d.decider} asked for changes to your quote for ${d.customer}:`,
    },
    ...(d.comment === null ? [] : [{ kind: "comment", text: d.comment } as const]),
    {
      kind: "facts",
      rows: [
        ["Quote", d.number],
        ["Customer", d.customer],
        ["Total", `${d.currency} ${grouped(d.total)}`],
      ],
    },
    {
      kind: "paragraph",
      text: d.approved
        ? `The quote's PDF is attached. It's ready to send to the customer from Pricewright; the offer is valid until ${longDate(d.validUntil)}.`
        : "Revise the quote and submit it again, or cancel it, in Pricewright.",
    },
  ];
  return email(s, {
    tenant: d.tenant.name,
    subject: d.approved ? `Quote ${d.number} approved` : `Quote ${d.number} needs changes`,
    preheader: d.approved
      ? `${d.decider} approved it. It's ready to send.${said}`
      : `${d.decider} asked for changes:${said}`,
    heading: d.approved ? "Your quote is approved" : "Your quote needs changes",
    blocks,
    footer: `${d.tenant.name}, sent with Pricewright. You get this email because you submitted the quote.`,
  });
}
