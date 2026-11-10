import fs from "node:fs";
import path from "node:path";
import type { SiteConfig } from "./types";

const IMG = /\.(jpe?g|png|webp|avif|heic)$/i;
export const baseName = (f: string) => f.replace(/\.[^.]+$/, "").toLowerCase();

/**
 * Factory mode: read the client's site file from sites/<SITE>/site.json and
 * auto-attach photos from sites/<SITE>/images/ by file name:
 *   hero.jpg · about.jpg · logo.png · room-<room id>.jpg · gallery-1.jpg, gallery-2.jpg …
 * (anything already set in site.json is left alone)
 * The build script converts every photo to optimized .webp, so we point at .webp names.
 */
export function getStaticSite(): SiteConfig {
  const slug = process.env.SITE;
  if (!slug) throw new Error("Use: npm run build-site -- <client-folder-name>");
  const dir = path.join(process.cwd(), "sites", slug);
  const file = path.join(dir, "site.json");
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);

  const raw = fs
    .readFileSync(file, "utf8")
    .replace(/("\/images\/[^"]+)\.(?:jpe?g|png|heic|webp|avif)"/gi, '$1.webp"');
  const site = JSON.parse(raw) as SiteConfig;

  const imgDir = path.join(dir, "images");
  const names = fs.existsSync(imgDir) ? fs.readdirSync(imgDir).filter((f) => IMG.test(f)).map(baseName) : [];
  const url = (n: string) => `/images/${n}.webp`;
  const has = (n: string) => names.includes(n);

  if (!site.hero.image && has("hero")) site.hero.image = url("hero");
  if (site.about && !site.about.image && has("about")) site.about.image = url("about");
  if (!site.logo && has("logo")) site.logo = url("logo");
  // room photos: room-<id>.jpg (main) and room-<id>-2.jpg, room-<id>-3.jpg … (extra, for the room page)
  for (const r of site.rooms) {
    const mine = names
      .filter((n) => n === `room-${r.id}` || new RegExp(`^room-${r.id}-\\d+$`).test(n))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    if (!mine.length) continue;
    if (!r.image) r.image = url(mine[0]);
    if (!r.images?.length) r.images = mine.map(url);
  }
  if (!site.gallery?.length) {
    const g = names.filter((n) => n.startsWith("gallery")).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    if (g.length) site.gallery = g.map(url);
  }
  return site;
}
