import { cache } from "react";
import { notFound } from "next/navigation";
import { getSiteConfig } from "./db";
import type { SiteConfig } from "./types";

/** Load a client's site config from the database (deduped per request). 404 if unknown. */
export const getSite = cache(async (slug: string): Promise<SiteConfig> => {
  const site = await getSiteConfig(slug);
  if (!site) notFound();
  return site;
});

export { t, price, waLink } from "./format";
