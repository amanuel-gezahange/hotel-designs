/**
 * Build the style showcase for a client and open it:   npm run themes -- beta-lodge
 * (A sample site with a bar to swipe through all 5 looks. Not for the final website.)
 */
import { spawnSync, spawn } from "node:child_process";
import { SLUG } from "../src/lib/validate";

const slug = process.argv[2];
if (!slug || !SLUG.test(slug)) {
  console.error("Usage: npm run themes -- <client-name>");
  process.exit(1);
}
const build = spawnSync("npx", ["tsx", "scripts/build-site.ts", slug, "--themes"], { stdio: "inherit" });
if (build.status !== 0) process.exit(build.status ?? 1);
console.log("\nOpening the showcase. Swipe left/right (or press ← →) to compare the styles.\n");
spawn("node", ["scripts/preview.mjs", `${slug}-themes`], { stdio: "inherit" });
