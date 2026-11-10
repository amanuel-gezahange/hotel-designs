import type { L, Lang, SiteConfig } from "./types";

/** Resolve localized text, falling back to English. */
export function t(text: L | undefined, lang: Lang): string {
  if (!text) return "";
  if (typeof text === "string") return text;
  return text[lang] || text.en;
}

export function price(amount: number, currency: SiteConfig["currency"], lang: Lang) {
  const n = new Intl.NumberFormat("en-US").format(amount);
  if (currency === "USD") return `$${n}`;
  return lang === "am" ? `${n} ብር` : `${n} ETB`;
}

export function waLink(site: SiteConfig, message?: string) {
  const base = `https://wa.me/${site.contact.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
