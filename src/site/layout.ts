/** The brand guide's page frame: the app bar, the navigation and the footer, on the tokens. */

export interface Page {
  /** The file name, also the navigation's key. */
  readonly file: string;
  readonly title: string;
  readonly body: string;
}

export const NAVIGATION: readonly { file: string; label: string }[] = [
  { file: "index.html", label: "Brand" },
  { file: "color.html", label: "Color" },
  { file: "type.html", label: "Type" },
  { file: "logo.html", label: "Logo" },
  { file: "tenants.html", label: "Tenants" },
  { file: "documents.html", label: "Documents" },
];

/** Source Serif 4 and Public Sans from Google Fonts, for the guide and its specimens. */
export const FONTS =
  "https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700" +
  "&family=Source+Serif+4:opsz,wght@8..60,600&display=swap";

const REPOSITORY = "https://github.com/odvprogra/pricewright-design";

/** Escape text for HTML content and attribute values. */
export function escape(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function layout(page: Page, version: string): string {
  const links = NAVIGATION.map(({ file, label }) => {
    const current = file === page.file ? ' aria-current="page"' : "";
    return `<a href="${file}"${current}>${label}</a>`;
  }).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(page.title)} · Pricewright brand guide</title>
<link rel="icon" href="logo/pricewright-mark-small.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="tokens.css">
<link rel="stylesheet" href="site.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="bar">
<a class="home" href="index.html"><img src="logo/pricewright-logo-inverse.svg" alt="Pricewright" height="28"></a>
<nav aria-label="Brand guide">${links}</nav>
</header>
<main id="main">
${page.body}
</main>
<footer>
<p>Pricewright design tokens ${escape(version)}. Pricewright, Northfield Supply and Larkspur Tool Co.
are fictional. <a href="${REPOSITORY}">Source on GitHub</a>.</p>
</footer>
</body>
</html>
`;
}
