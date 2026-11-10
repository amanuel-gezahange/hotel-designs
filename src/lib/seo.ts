import type { Metadata } from "next";
import { t } from "./format";
import type { Lang, SiteConfig } from "./types";

export function siteMetadata(site: SiteConfig, lang: Lang): Metadata {
  return {
    metadataBase: site.url ? new URL(site.url) : undefined,
    title: { default: `${site.name} · ${t(site.tagline, lang)}`, template: `%s · ${site.name}` },
    description: t(site.description, lang),
    openGraph: {
      title: site.name,
      description: t(site.description, lang),
      type: "website",
      ...(site.hero.image ? { images: [site.hero.image] } : {}),
    },
    alternates: {
      languages: Object.fromEntries(site.languages.map((x) => [x, `/${x}`])),
    },
  };
}
