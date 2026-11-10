/**
 * Lock in the look a client chose:   npm run style -- beta-lodge luxe
 * Styles: classic, modern, resort, heritage, luxe. Replaces the colors with that style's defaults.
 */
import fs from "node:fs";
import path from "node:path";
import { STYLE_NAMES, STYLE_PRESETS } from "../src/lib/presets";
import { SLUG, parseSiteConfig } from "../src/lib/validate";
import type { Style } from "../src/lib/types";

const [slug, style] = process.argv.slice(2);
const choices = Object.keys(STYLE_PRESETS).join(", ");
if (!slug || !SLUG.test(slug) || !style) {
  console.error(`Usage: npm run style -- <client-name> <${choices.replace(/, /g, "|")}>`);
  process.exit(1);
}
if (!(style in STYLE_PRESETS)) {
  console.error(`Unknown style "${style}". Choose one of: ${choices}`);
  process.exit(1);
}
const file = path.join("sites", slug, "site.json");
if (!fs.existsSync(file)) {
  console.error(`Not found: ${file}`);
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(file, "utf8"));
cfg.theme = { ...STYLE_PRESETS[style as Style] };
parseSiteConfig(cfg); // make sure the file is still valid
fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + "\n");
console.log(`✅ ${cfg.name} now uses the ${STYLE_NAMES[style as Style]} style.\n   Rebuild it:  npm run build-site -- ${slug}`);
