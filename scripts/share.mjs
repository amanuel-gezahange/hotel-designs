// Put a hotel website online so customers can see it:
//   npm run share -- sheger-guesthouse           design-picker version (customer can swipe all 15 looks)
//   npm run share -- sheger-guesthouse --final   the finished website (no design bar)
// First time: it opens your browser to log in to Netlify and asks you to name the site.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const final = args.includes("--final");
if (!slug || !fs.existsSync(`sites/${slug}/site.json`)) {
  const names = fs.readdirSync("sites").filter((n) => !n.startsWith("_") && fs.existsSync(`sites/${n}/site.json`));
  console.error(`Usage: npm run share -- <hotel-name> [--final]\nYour hotels: ${names.join(", ")}`);
  process.exit(1);
}
const outName = final ? slug : `${slug}-themes`;

console.log(`\n1/2  Building ${outName} ...\n`);
const b = spawnSync("npx", ["tsx", "scripts/build-site.ts", slug, ...(final ? [] : ["--themes"])], { stdio: "inherit" });
if (b.status !== 0) process.exit(b.status ?? 1);

// Upload from a clean folder OUTSIDE this project, so Netlify only sees the finished website
// (inside the project it mistakes it for a Next.js app and tries to build it).
const stage = path.join(os.tmpdir(), "stay-kit-share", outName);
fs.rmSync(stage, { recursive: true, force: true });
fs.cpSync(path.join("dist", outName), stage, { recursive: true });
// Remember which Netlify site belongs to this hotel, so sharing again updates the same link.
const saved = path.join(".netlify-sites", `${outName}.json`);
if (fs.existsSync(saved)) {
  fs.mkdirSync(path.join(stage, ".netlify"), { recursive: true });
  fs.copyFileSync(saved, path.join(stage, ".netlify", "state.json"));
}

console.log(`\n2/2  Uploading to Netlify ...\n`);
const d = spawnSync("npx", ["--yes", "netlify-cli", "deploy", "--prod", "--dir", "."], { cwd: stage, stdio: "inherit" });
const state = path.join(stage, ".netlify", "state.json");
if (fs.existsSync(state)) {
  fs.mkdirSync(".netlify-sites", { recursive: true });
  fs.copyFileSync(state, saved);
}
if (d.status !== 0) {
  console.error("\nUpload failed. Scroll up for the reason, then run the same command again.");
  process.exit(d.status ?? 1);
}
console.log(`\nDone. Send the "Deployed to production URL" link above to your customer.`);
