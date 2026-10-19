// `just logo`: the logo's SVG files into docs/brand/logo/, colored from the tokens.
import { mkdir, writeFile } from "node:fs/promises";

import { logoFiles } from "../src/logo-files.ts";

const directory = "docs/brand/logo";
await mkdir(directory, { recursive: true });
for (const [name, content] of Object.entries(await logoFiles())) {
  await writeFile(`${directory}/${name}`, content);
}
