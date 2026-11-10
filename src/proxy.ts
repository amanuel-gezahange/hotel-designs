import { NextResponse, type NextRequest } from "next/server";

/**
 * Multi-tenant routing: each hotel is served from its own host, and we rewrite it
 * internally to /s/<slug>/...
 *   <slug>.ROOT_DOMAIN   -> built-in subdomain (e.g. abay-lodge.localhost:3000 in dev)
 *   any other host       -> custom domain, looked up in the database
 * The bare ROOT_DOMAIN shows the platform itself (/admin).
 */
const ROOT = (process.env.ROOT_DOMAIN ?? "localhost").toLowerCase();
const domainCache = new Map<string, { slug: string | null; at: number }>();

async function resolveCustomDomain(host: string, origin: string): Promise<string | null> {
  const hit = domainCache.get(host);
  if (hit && Date.now() - hit.at < 60_000) return hit.slug;
  try {
    const res = await fetch(`${origin}/api/tenant?host=${encodeURIComponent(host)}`);
    const { slug } = (await res.json()) as { slug: string | null };
    domainCache.set(host, { slug, at: Date.now() });
    return slug;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").split(":")[0].toLowerCase().slice(0, 253);
  const { pathname } = req.nextUrl;

  if (host === ROOT || host === `www.${ROOT}`) return NextResponse.next();

  const slug = host.endsWith(`.${ROOT}`)
    ? host.slice(0, -(ROOT.length + 1))
    : await resolveCustomDomain(host, req.nextUrl.origin);

  // Only well-formed names may become part of an internal path (blocks "a/../b"-style host tricks)
  if (!slug || !/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])$/.test(slug)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `/s/${slug}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/|api/|admin|uploads/|favicon.ico).*)"],
};
