import { dict } from "@/lib/i18n";
import type { Lang, SiteConfig } from "@/lib/types";
import { LangLinks } from "./LangLinks";
import { Img } from "./ui";

export function Nav({ site, lang }: { site: SiteConfig; lang: Lang }) {
  const d = dict[lang];
  const links = site.sections
    .filter((s) => s !== "faq")
    .map((s) => ({ href: `/${lang}/#${s}`, label: d[s] }));
  const others = site.languages.filter((l) => l !== lang);

  const langSwitch = others.length ? <LangLinks current={lang} others={others} /> : null;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href={`/${lang}`} className="flex min-h-11 items-center gap-2">
          {site.logo && <Img src={site.logo} alt="" className="h-8 w-8" />}
          <span className="font-[family-name:var(--font-heading)] text-lg font-semibold text-brand-text">
            {site.name}
          </span>
        </a>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="inline-flex min-h-10 min-w-11 items-center justify-center text-muted hover:text-ink">
              {l.label}
            </a>
          ))}
          {langSwitch}
          <a
            href={`/${lang}/#contact`}
            className="inline-flex min-h-10 items-center rounded-[var(--radius)] bg-brand px-4 font-semibold text-on-brand hover:opacity-90"
          >
            {d.book}
          </a>
        </nav>

        {/* Mobile menu: <details> keeps it working without JavaScript */}
        <details className="group relative md:hidden">
          <summary
            aria-label={d.menu}
            className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full border border-line text-lg"
          >
            ☰
          </summary>
          <div className="absolute right-0 mt-2 w-56 rounded-[var(--radius)] border border-line bg-paper p-3 shadow-xl">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="block rounded px-3 py-2 hover:bg-brand-soft">
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex gap-2 px-3 py-2">
              {langSwitch}
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
