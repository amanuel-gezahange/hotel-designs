// One command to see a hotel website:   npm run try -- beta-lodge
// (builds it, then shows it at http://localhost:4000). No name = the sample hotel.
import { spawnSync, spawn } from "node:child_process";
import fs from "node:fs";

const slug = process.argv[2] ?? "demo-lodge";
if (!fs.existsSync(`sites/${slug}/site.json`)) {
  const names = fs.readdirSync("sites").filter((n) => !n.startsWith("_") && fs.existsSync(`sites/${n}/site.json`));
  console.error(`No hotel called "${slug}". Your hotels: ${names.join(", ")}`);
  process.exit(1);
}
console.log(`\n1/2  Building ${slug} ...\n`);
const b = spawnSync("npx", ["tsx", "scripts/build-site.ts", slug], { stdio: "inherit" });
if (b.status !== 0) process.exit(b.status ?? 1);
console.log(`\n2/2  Opening http://localhost:4000   (press Ctrl+C to stop)\n`);
if (process.platform === "darwin") spawn("open", ["http://localhost:4000"], { stdio: "ignore" }).unref();
process.env.PREVIEW_SLUG = slug;
await import("./preview.mjs");
