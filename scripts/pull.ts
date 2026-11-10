/**
 * Export a client from the visual editor (hosted admin) into the factory folder:
 *   npm run pull -- beta-lodge
 * Writes sites/<slug>/site.json and copies the photos you uploaded in the editor.
 */
import fs from "node:fs";
import path from "node:path";
import { getSiteConfig } from "../src/lib/db";
import { SLUG } from "../src/lib/validate";

const slug = process.argv[2];
if (slug && !SLUG.test(slug)) {
  console.error(`"${slug}" is not a valid client name. Use lowercase letters, numbers and dashes (example: beta-lodge).`);
  process.exit(1);
}
if (!slug) {
  console.error("Usage: npm run pull -- <client-slug>");
  process.exit(1);
}
const uploads = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");

async function main() {
  const cfg = await getSiteConfig(slug);
  if (!cfg) {
    console.error(`No client "${slug}" in the editor database. Create it at /admin/platform first.`);
    process.exit(1);
  }
  const imgDir = path.join("sites", slug, "images");
  fs.mkdirSync(imgDir, { recursive: true });
  let copied = 0;
  const json = JSON.stringify(cfg).replace(new RegExp(`/uploads/${slug}/([a-z0-9-]+\\.webp)`, "g"), (_m, file: string) => {
    const from = path.join(uploads, slug, file);
    if (fs.existsSync(from)) {
      fs.copyFileSync(from, path.join(imgDir, file));
      copied++;
    }
    return `/images/${file}`;
  });
  fs.writeFileSync(path.join("sites", slug, "site.json"), JSON.stringify(JSON.parse(json), null, 2) + "\n");
  console.log(`Pulled "${cfg.name}" → sites/${slug}/site.json (${copied} photos copied)`);
}
main();
