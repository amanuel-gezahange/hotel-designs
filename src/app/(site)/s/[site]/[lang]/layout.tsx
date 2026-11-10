import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSite } from "@/lib/site";
import { siteMetadata } from "@/lib/seo";
import type { Lang } from "@/lib/types";
import { SiteShell } from "@/components/SiteShell";

type Params = Promise<{ site: string; lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, site: slug } = await params;
  return siteMetadata(await getSite(slug), lang as Lang);
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const { lang, site: slug } = await params;
  const site = await getSite(slug);
  if (!site.languages.includes(lang as Lang)) notFound();
  return (
    <SiteShell site={site} lang={lang as Lang} themePreview="query">
      {children}
    </SiteShell>
  );
}
