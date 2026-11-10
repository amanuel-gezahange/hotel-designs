import { getSiteConfig } from "@/lib/db";

// Tenant root ("/") -> the site's default language.
// The redirect is RELATIVE on purpose: it must stay on the hotel's own address
// (sheger-guesthouse.example.com/en), never fall back to the platform's host.
export async function GET(_req: Request, { params }: { params: Promise<{ site: string }> }) {
  const site = await getSiteConfig((await params).site);
  if (!site) return new Response("Not found", { status: 404 });
  return new Response(null, { status: 307, headers: { Location: `/${site.defaultLang}` } });
}
