import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { canManage, getSession } from "@/lib/auth";
import { SLUG } from "@/lib/validate";

export const maxDuration = 300;
let busy = false;

/** Builds the client's finished website and sends it as a zip. Needs the full project folder (local use). */
export async function GET(req: Request) {
  const session = await getSession();
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!session || !SLUG.test(slug) || !canManage(session, slug)) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!fs.existsSync("scripts/make.ts")) return Response.json({ error: "Downloads work on your own computer, not on the hosted server." }, { status: 501 });
  if (busy) return Response.json({ error: "Another website is being built. Try again in a minute." }, { status: 429 });
  busy = true;
  try {
    const log: string[] = [];
    const code = await new Promise<number>((resolve) => {
      const p = spawn("npx", ["tsx", "scripts/make.ts", slug], { env: { ...process.env, NODE_ENV: "production" } });
      p.stdout.on("data", (d) => log.push(String(d)));
      p.stderr.on("data", (d) => log.push(String(d)));
      p.on("close", (c) => resolve(c ?? 1));
    });
    const zip = path.join("dist", `${slug}.zip`);
    if (code !== 0 || !fs.existsSync(zip)) {
      const msg = log.join("").replace(/\x1b\[[0-9;]*m/g, "").split("\n").filter((l) => /❌|Error|error/.test(l)).slice(0, 3).join(" ") || "Build failed";
      return Response.json({ error: msg }, { status: 500 });
    }
    return new Response(fs.readFileSync(zip), {
      headers: { "content-type": "application/zip", "content-disposition": `attachment; filename="${slug}.zip"` },
    });
  } finally {
    busy = false;
  }
}
