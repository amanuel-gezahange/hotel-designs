/**
 * Loads sites/*.json into the database and creates the operator (super admin) account.
 *   ADMIN_EMAIL=you@x.com ADMIN_PASSWORD=... npm run seed
 */
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { upsertSite, upsertUser } from "../src/lib/db";

const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
const password = process.env.ADMIN_PASSWORD ?? "change-me-now";

async function main() {
  const dir = path.join(process.cwd(), "sites");
  for (const slug of fs.readdirSync(dir)) {
    const file = path.join(dir, slug, "site.json");
    if (slug.startsWith("_") || !fs.existsSync(file)) continue;
    await upsertSite(slug, JSON.parse(fs.readFileSync(file, "utf8")));
    console.log(`site: ${slug}`);
  }
  await upsertUser(email, await bcrypt.hash(password, 10), "super", null);
  console.log(`operator login: ${email}${process.env.ADMIN_PASSWORD ? "" : "  password: change-me-now (CHANGE IT)"}`);
}

main();
