"use client";

import { usePathname } from "next/navigation";
import { langNames } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

/**
 * Language switcher that keeps the visitor on the same page
 * (e.g. /en/rooms/deluxe → /am/rooms/deluxe) instead of jumping to the home page.
 */
export function LangLinks({ current, others }: { current: Lang; others: Lang[] }) {
  const pathname = usePathname() ?? `/${current}`;
  const rest = pathname.startsWith(`/${current}`) ? pathname.slice(current.length + 1) : "";
  return (
    <>
      {others.map((l) => (
        <a
          key={l}
          href={`/${l}${rest}`}
          hrefLang={l}
          className="inline-flex min-h-10 items-center rounded-full border border-line px-3.5 text-xs font-semibold hover:bg-brand-soft"
        >
          {langNames[l]}
        </a>
      ))}
    </>
  );
}
