import type { Lang, SaveInquiry, SiteConfig } from "@/lib/types";
import { Hero } from "./Hero";
import { sectionMap } from "./sections";

/** The whole home page of a hotel site: hero + the sections the client chose. */
export function SiteHome({
  site,
  lang,
  slug,
  saveInquiry,
}: {
  site: SiteConfig;
  lang: Lang;
  slug?: string;
  saveInquiry?: SaveInquiry;
}) {
  return (
    <>
      <Hero site={site} lang={lang} />
      {site.sections.map((id) => {
        const Section = sectionMap[id];
        return Section ? (
          <Section key={id} site={site} lang={lang} slug={slug} saveInquiry={saveInquiry} />
        ) : null;
      })}
    </>
  );
}
