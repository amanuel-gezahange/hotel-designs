import { getSite } from "@/lib/site";

export async function GET(req: Request, { params }: { params: Promise<{ site: string }> }) {
  const site = await getSite((await params).site);
  const base = site.url ?? new URL(req.url).origin;
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`, {
    headers: { "content-type": "text/plain" },
  });
}
