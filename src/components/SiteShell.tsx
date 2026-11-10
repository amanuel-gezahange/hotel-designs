import {
  Alegreya,
  Bricolage_Grotesque,
  Caveat,
  Cormorant_Garamond,
  DM_Serif_Display,
  EB_Garamond,
  Fraunces,
  Fredoka,
  Inter,
  Noto_Sans_Ethiopic,
  Noto_Serif_Ethiopic,
  Oswald,
  Outfit,
  Playfair_Display,
} from "next/font/google";
import "@/app/globals.css";
import { t, waLink } from "@/lib/format";
import { dict } from "@/lib/i18n";
import { themeVars } from "@/lib/presets";
import type { Lang, SiteConfig } from "@/lib/types";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { MotionEngine } from "./MotionEngine";
import { ThemeSwitcher } from "./ThemeSwitcher";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const ethiopic = Noto_Sans_Ethiopic({ subsets: ["ethiopic"], variable: "--font-ethiopic" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
// Extra display fonts: each style picks its own. preload:false = only downloaded when a style uses it.
// (next/font needs the options written out literally, so they are not shared via a variable.)
const ethiopicSerif = Noto_Serif_Ethiopic({ subsets: ["ethiopic"], variable: "--font-ethiopic-serif", preload: false, display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", preload: false, display: "swap" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald", preload: false, display: "swap" });
const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka", preload: false, display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "600"], variable: "--font-cormorant", preload: false, display: "swap" });
const alegreya = Alegreya({ subsets: ["latin"], variable: "--font-alegreya", preload: false, display: "swap" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", preload: false, display: "swap" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", preload: false, display: "swap" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", preload: false, display: "swap" });
const garamond = EB_Garamond({ subsets: ["latin"], variable: "--font-garamond", preload: false, display: "swap" });
const dmSerif = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-dmserif", preload: false, display: "swap" });
const FONT_VARS = [inter, ethiopic, ethiopicSerif, playfair, fraunces, oswald, fredoka, cormorant, alegreya, bricolage, caveat, outfit, garamond, dmSerif]
  .map((f) => f.variable)
  .join(" ");

/** The <html> page frame shared by every hotel site (hosted or standalone). */
export function SiteShell({
  site,
  lang,
  children,
  themePreview,
}: {
  site: SiteConfig;
  lang: Lang;
  children: React.ReactNode;
  /** Show the swipe-through-styles bar: "always" (showcase build) or "query" (only with ?themes). */
  themePreview?: "always" | "query";
}) {
  const { theme } = site;

  const style = themeVars(theme) as React.CSSProperties;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": site.type === "guesthouse" ? "BedAndBreakfast" : "Hotel",
    name: site.name,
    description: t(site.description, lang),
    telephone: site.contact.phone,
    email: site.contact.email,
    url: site.url,
    address: {
      "@type": "PostalAddress",
      streetAddress: t(site.contact.address, "en"),
      addressLocality: site.contact.city,
      addressCountry: "ET",
    },
  };

  return (
    <html
      lang={lang}
      className={FONT_VARS}
      style={style}
      data-style={theme.style ?? "classic"}
      data-heading={theme.headingFont}
      data-motion={theme.motion ?? "on"}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased">
        {/* Marks the page as "JavaScript on" before anything is drawn, so scroll animations never flash */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <Nav site={site} lang={lang} />
        <main>{children}</main>
        <Footer site={site} lang={lang} />
        <a
          href={waLink(site)}
          target="_blank"
          rel="noopener"
          aria-label="WhatsApp"
          className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-2xl text-white shadow-lg transition hover:scale-105"
        >
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden>
            <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.9L2 22l5.25-1.38A9.9 9.9 0 1 0 12.04 2Zm5.8 14.1c-.25.7-1.45 1.33-2 1.4-.52.07-1.17.1-1.88-.12a17 17 0 0 1-1.7-.63c-3-1.3-4.94-4.33-5.09-4.53-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.6-.37.8-.37h.57c.18 0 .43-.07.67.52.25.6.85 2.07.92 2.22.08.15.13.32.03.52-.1.2-.15.32-.3.5-.15.17-.31.38-.45.51-.15.15-.3.31-.13.6.17.3.77 1.27 1.65 2.05 1.13 1 2.08 1.31 2.38 1.46.3.15.47.12.65-.07.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.72.82 2.02.97.3.15.5.22.57.35.07.12.07.72-.18 1.42Z" />
          </svg>
        </a>
        <MotionEngine />
        {themePreview && (
          <ThemeSwitcher
            initial={theme.style ?? "classic"}
            mode={themePreview}
            labels={{
              theme: dict[lang].themeLabel,
              hint: dict[lang].swipeHint,
              prev: dict[lang].prev,
              next: dict[lang].next,
              show: dict[lang].showThemes,
              hide: dict[lang].hideThemes,
              tourStart: dict[lang].tourStart,
              tourStop: dict[lang].tourStop,
            }}
          />
        )}
      </body>
    </html>
  );
}
