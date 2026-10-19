// `just site`: the brand guide into dist/site/, as GitHub Pages publishes it.
import { buildSite } from "../src/site/build.ts";

const written = await buildSite("dist/site");
console.log(`dist/site: ${written.join(", ")}`);
