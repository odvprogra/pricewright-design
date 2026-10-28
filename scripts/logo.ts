// `just logo`: the logo's SVG files into docs/brand/logo/, colored from the tokens, and the demo
// tenants' logos into docs/brand/tenants/.
import { mkdir, writeFile } from "node:fs/promises";

import { logoFiles } from "../src/logo-files.ts";
import { tenantLogoFiles } from "../src/tenants.ts";

const directories: [string, Record<string, string>][] = [
  ["docs/brand/logo", await logoFiles()],
  ["docs/brand/tenants", tenantLogoFiles()],
];
for (const [directory, files] of directories) {
  await mkdir(directory, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    await writeFile(`${directory}/${name}`, content);
  }
}
