/**
 * Produce the finished website for a client:   npm run build-site -- beta-lodge
 * Output:  dist/<slug>/   (upload this folder)   and   dist/<slug>.zip
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import { SLUG, parseSiteConfig } from "../src/lib/validate";

const args = process.argv.slice(2);
const showcase = args.includes("--themes"); // sample site with the swipe-through-styles bar
const slug = args.find((a) => !a.startsWith("--"));
const outName = showcase ? `${slug}-themes` : slug;
if (slug && !SLUG.test(slug)) {
  console.error(`"${slug}" is not a valid client name. Use lowercase letters, numbers and dashes (example: beta-lodge).`);
  process.exit(1);
}
if (!slug) {
  console.error("Usage: npm run build-site -- <client-folder-name>");
  process.exit(1);
}
const siteDir = path.join("sites", slug);
const cfgFile = path.join(siteDir, "site.json");
if (!fs.existsSync(cfgFile)) {
  console.error(`Not found: ${cfgFile}\nCreate it first: npm run new-site -- ${slug} "Hotel Name"`);
  process.exit(1);
}

/* ---- 1. Friendly checks: catch forgotten placeholders before the client sees them ---- */
let cfg;
try {
  cfg = JSON.parse(fs.readFileSync(cfgFile, "utf8"));
} catch (e) {
  console.error(`\n❌ ${cfgFile} is not valid JSON: ${(e as Error).message}\n   (usually a missing comma, or a missing/extra quote or bracket)`);
  process.exit(1);
}
try {
  parseSiteConfig(cfg);
} catch (e) {
  console.error(`\n❌ Problem in ${cfgFile}\n   ${(e as Error).message}\n\nFix that line and run the build again.`);
  process.exit(1);
}
const warnings: string[] = [];
if (cfg.name === "Your Hotel Name") warnings.push("Hotel name is still the template placeholder");
if (cfg.contact.whatsapp === "251900000000") warnings.push("WhatsApp number is still the placeholder (251900000000)");
if (!/^\d{9,15}$/.test(cfg.contact.whatsapp)) warnings.push('WhatsApp must be digits only with country code, e.g. 251911234567');
if (cfg.contact.email === "info@example.com") warnings.push("Email is still info@example.com");
if (/Street name/.test(JSON.stringify(cfg.contact.address))) warnings.push("Address is still the placeholder");
const imgDir = path.join(siteDir, "images");
const photos = fs.existsSync(imgDir) ? fs.readdirSync(imgDir).filter((f) => /\.(jpe?g|png|webp|avif|heic)$/i.test(f)) : [];
if (!cfg.url) warnings.push('No website address ("url" in site.json, e.g. https://betalodge.com): needed for Google/social previews');
if (!photos.some((f) => /^hero\./i.test(f))) warnings.push("No hero photo (images/hero.jpg): the top of the page will show a color gradient");
const have = new Set(photos.map((f) => f.replace(/\.[^.]+$/, "").toLowerCase()));
const referenced = new Set([...JSON.stringify(cfg).matchAll(/"\/images\/([^"]+?)\.[a-z0-9]+"/gi)].map((m) => m[1].toLowerCase()));
for (const r of referenced) if (!have.has(r)) warnings.push(`site.json uses /images/${r} but no such photo is in sites/${slug}/images/`);
if (warnings.length) {
  console.log("\n⚠️  Check before delivering:");
  warnings.forEach((w) => console.log("   - " + w));
  console.log();
}

/* ---- 2. Build the static website ----
 * Runs in a private copy (.factory-work) so it can never disturb `npm run dev`
 * or change your tsconfig.json. */
const work = ".factory-work";
const out = path.join(work, ".factory-out");
fs.rmSync(work, { recursive: true, force: true });
fs.mkdirSync(path.join(work, "sites"), { recursive: true });
for (const f of ["src", "public", "package.json", "next.config.ts", "tsconfig.json"]) {
  if (fs.existsSync(f)) fs.cpSync(f, path.join(work, f), { recursive: true });
}
fs.cpSync(siteDir, path.join(work, "sites", slug), { recursive: true });
fs.symlinkSync(path.resolve("node_modules"), path.join(work, "node_modules"), "dir");

const build = spawnSync("npx", ["next", "build"], {
  cwd: work,
  stdio: "inherit",
  env: { ...process.env, FACTORY: "1", SITE: slug, FACTORY_OUT: ".factory-out", ...(showcase ? { SHOWCASE: "1" } : {}) },
});
if (build.status !== 0) {
  console.error("\nBuild failed. Scroll up for the first error message.");
  process.exit(build.status ?? 1);
}

/* ---- 3. Optimize photos (max 1800px wide, WebP) ---- */
async function photos_() {
  fs.mkdirSync(path.join(out, "images"), { recursive: true });
  let before = 0;
  let after = 0;
  for (const f of photos) {
    const src = path.join(imgDir, f);
    const dest = path.join(out, "images", f.replace(/\.[^.]+$/, "").toLowerCase() + ".webp");
    const buf = await sharp(src).rotate().resize({ width: 1800, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    fs.writeFileSync(dest, buf);
    before += fs.statSync(src).size;
    after += buf.length;
  }
  if (photos.length) console.log(`Photos: ${photos.length} optimized (${(before / 1e6).toFixed(1)} MB → ${(after / 1e6).toFixed(1)} MB)`);
}

/* ---- 4. Package ---- */
(async () => {
  await photos_();
  fs.mkdirSync("dist", { recursive: true });
  const dest = path.join("dist", outName!);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(out, dest, { recursive: true });
  fs.rmSync(work, { recursive: true, force: true });
  const zip = path.resolve("dist", `${outName}.zip`);
  fs.rmSync(zip, { force: true });
  spawnSync("zip", ["-qr", zip, "."], { cwd: dest });
  console.log(showcase ? `
✅ Style showcase ready: ${cfg.name}
   Folder: dist/${outName}/      ← sample with the swipe-through-styles bar (hidden from Google)
   Zip:    dist/${outName}.zip   ← send this to the client, or upload it to a test address
   Preview: npm run preview -- ${outName}
   Then lock in their choice:  npm run style -- ${slug} <classic|modern|resort|heritage|luxe>
` : `
✅ Done: ${cfg.name}
   Folder: dist/${slug}/        ← upload the contents to any web hosting
   Zip:    dist/${slug}.zip     ← or send this to the client
   Preview: npm run preview -- ${slug}
`);
})();
