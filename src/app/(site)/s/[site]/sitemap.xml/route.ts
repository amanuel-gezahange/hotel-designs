import { getSite } from "@/lib/site";

export async function GET(req: Request, { params }: { params: Promise<{ site: string }> }) {
  const site = await getSite((await params).site);
  const base = site.url ?? new URL(req.url).origin;
  const urls = site.languages
    .flatMap((l) => [`${base}/${l}`, ...site.rooms.map((r) => `${base}/${l}/rooms/${r.id}`)])
    .map((u) => `<url><loc>${u}</loc></url>`)
    .join("");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { "content-type": "application/xml" } },
  );
}
