import { beforeAll, describe, expect, it } from "vitest";

import {
  EMAIL_TOKENS,
  type Email,
  type EmailStyle,
  decisionEmail,
  emailStyle,
  quoteSentEmail,
  sampleEmails,
} from "../src/documents/emails.ts";
import { APPROVED_NUMBER, REJECTED_NUMBER, sampleDecision } from "../src/documents/sample.ts";
import { sampleQuotation } from "../src/documents/sample.ts";
import { builtTokens } from "../src/logo-files.ts";

let built: Record<string, string>;
let style: EmailStyle;
let emails: Record<string, Email>;
const accent = sampleQuotation().tenant.accent;

beforeAll(async () => {
  built = await builtTokens();
  style = emailStyle(built, accent);
  emails = sampleEmails(built);
});

const each = (check: (name: string, email: Email) => void): void => {
  for (const [name, email] of Object.entries(emails)) {
    check(name, email);
  }
};

describe("every email", () => {
  it("names its language and direction", () => {
    each((name, email) => expect(email.html, name).toContain('<html lang="en" dir="ltr">'));
  });

  it("lays out with presentation tables, and gives its facts table row headers", () => {
    each((name, email) => {
      const tables = email.html.match(/<table\b[^>]*>[\s\S]*?(?=<table\b|$)/g) ?? [];
      expect(tables.length, name).toBeGreaterThanOrEqual(3);
      for (const table of tables) {
        if (!table.startsWith('<table role="presentation"')) {
          expect(table, name).toContain('<th scope="row"');
        }
      }
    });
  });

  it("styles inline only, with no class, style block, custom property or web font", () => {
    each((name, email) => {
      expect(email.html, name).not.toMatch(/<style|<link|class=|var\(|@font-face|@import/);
    });
  });

  it("takes every color from the tokens, apart from the tenant's accent", () => {
    const allowed = new Set([
      accent,
      ...Object.values(EMAIL_TOKENS).map((path) => built[path.replaceAll(".", "-")]),
    ]);
    each((name, email) => {
      for (const color of email.html.match(/#[0-9a-f]{3,8}\b/gi) ?? []) {
        expect(allowed, `${name}: ${color}`).toContain(color);
      }
      expect(email.html, name).not.toMatch(/rgba?\(|hsla?\(/);
    });
  });

  it("sets every font size from the size tokens, in pixels", () => {
    const sizes = new Set(Object.values(style.size).map((px) => `${px}px`));
    each((name, email) => {
      for (const [, size] of email.html.matchAll(/font-size:(\d+(?:\.\d+)?px)/g)) {
        if (size !== "0px") {
          expect(sizes, `${name}: ${size}`).toContain(size);
        }
      }
    });
  });

  it("uses the tokens' font stacks, which fall back to web-safe fonts", () => {
    each((name, email) => {
      for (const [, stack] of email.html.matchAll(/font-family:([^;]+);/g)) {
        expect([style.serif, style.sans], name).toContain(stack);
      }
    });
    expect(style.serif).toMatch(/Georgia.*serif$/);
    expect(style.sans).toMatch(/Arial, sans-serif$/);
  });

  it("is one column of at most 600 px, topped by the tenant's rule", () => {
    each((name, email) => {
      expect(email.html, name).toContain("max-width:600px");
      expect(email.html, name).toContain(
        `height:4px;line-height:4px;font-size:0;background:${accent};`,
      );
    });
  });

  it("hides its preview line in the body and names it in the inbox", () => {
    each((name, email) => {
      expect(email.html, name).toContain(
        `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;" aria-hidden="true">`,
      );
      expect(email.preheader.length, name).toBeLessThanOrEqual(140);
    });
  });

  it("keeps numbers out of its serif heading", () => {
    each((name, email) => {
      const heading = email.html.match(/<h1[^>]*>([^<]*)<\/h1>/)?.[1] ?? "";
      expect(heading, name).not.toMatch(/\d/);
    });
  });

  it("has a plain-text part with the same facts and no markup", () => {
    each((name, email) => {
      expect(email.text, name).not.toMatch(/<[a-z]|&[a-z]+;/);
      expect(email.text, name).toMatch(/Total: USD [\d,]+\.\d\d\n/);
      expect(email.text, name).toMatch(/\n\nNorthfield Supply, sent with Pricewright\.[^\n]*\n$/);
    });
  });
});

describe("the quotation sent to the customer", () => {
  it("is formal, names the quotation and attaches it", () => {
    const sent = emails["email-quote-sent"];

    expect(sent?.subject).toBe("Quotation NF-2026-000122 from Northfield Supply");
    expect(sent?.text).toContain(
      "Taylor Brooks at Northfield Supply sends you a quotation for Stonegate Precision Machining Co.\n",
    );
    expect(sent?.text).toContain(
      "Quotation: NF-2026-000122\nTotal: USD 1,833.29\nValid until: November 11, 2026",
    );
    expect(sent?.text).toContain("Reply to this email to reach Taylor Brooks.");
    expect(sent?.text).not.toMatch(/n't|'s |'re |'ll /);
  });
});

describe("a manager's decision, to the rep", () => {
  it("says who approved, and that the quote is ready to send", () => {
    const approved = emails["email-quote-approved"];

    expect(approved?.subject).toBe(`Quote ${APPROVED_NUMBER} approved`);
    expect(approved?.preheader).toBe(
      "Morgan Reyes approved it. It's ready to send. “Fine for this volume.”",
    );
    expect(approved?.text).toMatch(/^Hi Taylor,\n\nMorgan Reyes approved your quote for /);
    expect(approved?.text).toContain("> Fine for this volume.");
  });

  it("puts the comment first when it asks for changes", () => {
    const rejected = emails["email-quote-rejected"];
    const decision = sampleDecision(REJECTED_NUMBER);

    expect(rejected?.subject).toBe(`Quote ${REJECTED_NUMBER} needs changes`);
    expect(rejected?.preheader).toBe(`Morgan Reyes asked for changes: “${decision.comment}”`);
    expect(rejected?.text).toContain(
      `Morgan Reyes asked for changes to your quote for Thornbury Medical Clinic LLC:\n\n> ${decision.comment}\n`,
    );
  });

  it("leaves out the quoted comment when there is none", () => {
    const silent = decisionEmail(style, { ...sampleDecision(APPROVED_NUMBER), comment: null });

    expect(silent.html).not.toContain("<blockquote");
    expect(silent.preheader).toBe("Morgan Reyes approved it. It's ready to send.");
  });

  it("escapes what people typed", () => {
    const typed = decisionEmail(style, {
      ...sampleDecision(REJECTED_NUMBER),
      comment: '<script>"x" & y</script>',
    });

    expect(typed.html).toContain("&lt;script&gt;&quot;x&quot; &amp; y&lt;/script&gt;");
    expect(typed.text).toContain('> <script>"x" & y</script>');
  });
});

describe("names that end in a period", () => {
  it("do not get a second one", () => {
    const quotation = sampleQuotation();
    const larkspur = quoteSentEmail(style, {
      ...quotation,
      customer: { ...quotation.customer, name: "Larkspur Tool Co." },
    });

    expect(larkspur.text).toContain("a quotation for Larkspur Tool Co.\n");
  });
});
