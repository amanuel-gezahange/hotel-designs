import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { canManage, getSession } from "@/lib/auth";
import { tooMany } from "@/lib/ratelimit";
import { SLUG } from "@/lib/validate";

const UPLOAD_ROOT = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");

/**
 * Stores an image for a site. Photos are auto-rotated, resized to max 1800px and
 * converted to WebP so heavy phone photos don't slow down the guest's page.
 * NOTE: this writes to local disk. On serverless hosting, swap this for object storage (S3/R2).
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!SLUG.test(slug) || !canManage(session, slug)) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (tooMany(`upload:${session.email}`, 60, 10 * 60_000))
    return Response.json({ error: "Too many uploads. Wait a few minutes." }, { status: 429 });

  // Refuse huge requests before reading them into memory
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > 13 * 1024 * 1024) return Response.json({ error: "Image too large (max 12MB)" }, { status: 413 });

  let file: FormDataEntryValue | null;
  try {
    file = (await req.formData()).get("file");
  } catch {
    return Response.json({ error: "Bad upload" }, { status: 400 });
  }
  if (!(file instanceof File)) return Response.json({ error: "No file" }, { status: 400 });
  if (file.size > 12 * 1024 * 1024) return Response.json({ error: "Image too large (max 12MB)" }, { status: 413 });

  let out: Buffer;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    // Only real photo formats. (Blocks SVG/PDF, which can carry scripts or external references.)
    const meta = await sharp(input, { limitInputPixels: 60_000_000 }).metadata();
    if (!meta.format || !["jpeg", "png", "webp", "gif", "avif", "heif", "tiff"].includes(meta.format))
      return Response.json({ error: "Please upload a JPG, PNG or WebP photo" }, { status: 400 });
    out = await sharp(input, { limitInputPixels: 60_000_000 })
      .rotate()
      .resize({ width: 1800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return Response.json({ error: "Not a valid image" }, { status: 400 });
  }

  const id = `${randomUUID()}.webp`;
  await fs.mkdir(path.join(UPLOAD_ROOT, slug), { recursive: true });
  await fs.writeFile(path.join(UPLOAD_ROOT, slug, id), out);
  return Response.json({ url: `/uploads/${slug}/${id}` });
}
