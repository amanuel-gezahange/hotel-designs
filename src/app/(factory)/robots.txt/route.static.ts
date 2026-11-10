import { getStaticSite } from "@/lib/static-site";

export const dynamic = "force-static";

export function GET() {
  const site = getStaticSite();
  if (process.env.SHOWCASE === "1") return new Response("User-agent: *\nDisallow: /\n", { headers: { "content-type": "text/plain" } });
  return new Response(`User-agent: *\nAllow: /\n${site.url ? `Sitemap: ${site.url}/sitemap.xml\n` : ""}`, {
    headers: { "content-type": "text/plain" },
  });
}
