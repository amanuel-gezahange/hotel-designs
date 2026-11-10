import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");

export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  if (parts.length !== 2 || !parts.every((p) => /^[a-z0-9-]+(\.webp)?$/.test(p)))
    return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(path.join(ROOT, ...parts));
    return new Response(new Uint8Array(data), {
      headers: { "content-type": "image/webp", "cache-control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
