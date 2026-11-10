import fs from "node:fs";
import path from "node:path";
import { createSite, getSiteConfig } from "./db";

/** Adds hotels from the sites/ folder that the editor does not know yet. Never overwrites existing ones. */
export async function importSites(): Promise<string[]> {
  const dir = path.join(process.cwd(), "sites");
  if (!fs.existsSync(dir)) return [];
  const added: string[] = [];
  for (const slug of fs.readdirSync(dir)) {
    const file = path.join(dir, slug, "site.json");
    if (slug.startsWith("_") || !fs.existsSync(file)) continue;
    if (await getSiteConfig(slug, true)) continue;
    await createSite(slug, JSON.parse(fs.readFileSync(file, "utf8")));
    added.push(slug);
  }
  return added;
}
