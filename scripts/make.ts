/**
 * One command from editor to finished website:   npm run make -- beta-lodge
 * (pull from the editor, then build the standalone site)
 */
import { spawnSync } from "node:child_process";
import { SLUG } from "../src/lib/validate";

const slug = process.argv[2];
if (slug && !SLUG.test(slug)) {
  console.error(`"${slug}" is not a valid client name. Use lowercase letters, numbers and dashes (example: beta-lodge).`);
  process.exit(1);
}
if (!slug) {
  console.error("Usage: npm run make -- <client-slug>");
  process.exit(1);
}
for (const script of ["scripts/pull.ts", "scripts/build-site.ts"]) {
  const r = spawnSync("npx", ["tsx", script, slug], { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
