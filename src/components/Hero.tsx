import { dict } from "@/lib/i18n";
import { t } from "@/lib/site";
import type { Lang, SiteConfig } from "@/lib/types";
import { ButtonLink, Img } from "./ui";

export function Hero({ site, lang }: { site: SiteConfig; lang: Lang }) {
  const d = dict[lang];
  const { hero } = site;
  return (
    <section className="hero relative isolate overflow-hidden text-white">
      <Img src={hero.image} priority className="hero-bg absolute inset-0 -z-20 h-full w-full" />
      <div className="hero-overlay absolute inset-0 -z-10" />
      <div className="hero-inner mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-5 py-24">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-white/95">
          {site.contact.city}
        </p>
        <h1 className="hero-title max-w-3xl font-[family-name:var(--font-heading)] text-4xl font-semibold leading-tight sm:text-6xl">
          {t(hero.title ?? site.name, lang)}
        </h1>
        <p className="mt-5 max-w-xl text-lg text-white/95">{t(hero.subtitle, lang)}</p>
        <div className="hero-actions mt-8 flex flex-wrap gap-3">
          <ButtonLink href="#contact" variant="accent">
            {t(hero.cta, lang) || d.book}
          </ButtonLink>
          {site.sections.includes("rooms") && (
            <ButtonLink href="#rooms" variant="outline">
              {d.viewRooms}
            </ButtonLink>
          )}
        </div>
      </div>
    </section>
  );
}
