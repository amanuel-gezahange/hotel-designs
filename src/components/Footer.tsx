import { dict } from "@/lib/i18n";
import type { Lang, SiteConfig } from "@/lib/types";

export function Footer({ site, lang }: { site: SiteConfig; lang: Lang }) {
  const d = dict[lang];
  const social = Object.entries(site.social ?? {}).filter(([, v]) => v);
  return (
    <footer className="bg-brand text-on-brand">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm sm:flex-row">
        <p>
          © {site.name}. {d.rights}
        </p>
        <div className="flex gap-4 capitalize">
          {social.map(([k, v]) => (
            <a key={k} href={v} target="_blank" rel="noopener" className="inline-flex min-h-10 items-center opacity-80 hover:opacity-100">
              {k}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
