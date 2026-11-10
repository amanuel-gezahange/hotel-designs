import { slugForDomain } from "@/lib/db";

// Used by proxy.ts to map a custom domain to a site slug.
export async function GET(req: Request) {
  const host = (new URL(req.url).searchParams.get("host") ?? "").toLowerCase().slice(0, 253);
  return Response.json({ slug: host ? await slugForDomain(host) : null });
}
