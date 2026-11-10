/**
 * Start a new client:   npm run new-site -- beta-lodge "Beta Lodge"
 */
import fs from "node:fs";
import path from "node:path";

import { STYLE_PRESETS } from "../src/lib/presets";
import { SLUG } from "../src/lib/validate";

const args = process.argv.slice(2);
const styleArg = args.find((a) => a.startsWith("--style="))?.split("=")[1] ?? "classic";
const [slug, ...rest] = args.filter((a) => !a.startsWith("--"));
if (!slug || !SLUG.test(slug)) {
  console.error('Usage: npm run new-site -- <folder-name-lowercase> "Hotel Name" [--style=classic|modern|resort]');
  process.exit(1);
}
if (!(styleArg in STYLE_PRESETS)) {
  console.error(`Unknown style "${styleArg}". Choose: ${Object.keys(STYLE_PRESETS).join(", ")}`);
  process.exit(1);
}
const dir = path.join("sites", slug);
if (fs.existsSync(dir)) {
  console.error(`sites/${slug} already exists.`);
  process.exit(1);
}
fs.mkdirSync(path.join(dir, "images"), { recursive: true });
const cfg = JSON.parse(fs.readFileSync("sites/_template/site.json", "utf8"));
cfg.theme = { ...STYLE_PRESETS[styleArg as keyof typeof STYLE_PRESETS] };
cfg.name = rest.join(" ").replace(/\s+/g, " ").trim().slice(0, 100) || slug;
cfg.hero.title = { en: `Welcome to ${cfg.name}`, am: cfg.hero.title.am };
fs.writeFileSync(path.join(dir, "site.json"), JSON.stringify(cfg, null, 2) + "\n");
fs.writeFileSync(
  path.join(dir, "images", "PUT-PHOTOS-HERE.txt"),
  `Drop the client's photos in this folder. Name them like this and they attach automatically:

  hero.jpg           the big photo at the top
  about.jpg          photo next to the "About" text
  logo.png           logo (optional)
  room-standard.jpg  photo for the room whose "id" is standard in site.json
  room-deluxe.jpg    ...and so on, one per room id
  room-standard-2.jpg room-standard-3.jpg ...  extra photos for that room's own page
  gallery-1.jpg      gallery-2.jpg  gallery-3.jpg ...  (any number)

Any size or format is fine (jpg, png, heic). They are shrunk and optimized for you.
`,
);
console.log(`
Created sites/${slug}/
  1. Edit   sites/${slug}/site.json   (name, phone, WhatsApp, rooms, prices, colors)
  2. Add photos to sites/${slug}/images/   (see PUT-PHOTOS-HERE.txt)
  3. Build  npm run build-site -- ${slug}
  4. Preview npm run preview -- ${slug}
`);
