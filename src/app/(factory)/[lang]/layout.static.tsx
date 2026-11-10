import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStaticSite } from "@/lib/static-site";
import { siteMetadata } from "@/lib/seo";
import type { Lang } from "@/lib/types";
import { SiteShell } from "@/components/SiteShell";

type Params = Promise<{ lang: string }>;

export function generateStaticParams() {
  return getStaticSite().languages.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const meta = siteMetadata(getStaticSite(), (await params).lang as Lang);
  // A showcase (style-comparison) build is a sample for the client: keep it out of Google
  return process.env.SHOWCASE === "1" ? { ...meta, robots: { index: false, follow: false } } : meta;
}

export default async function Layout({ children, params }: { children: React.ReactNode; params: Params }) {
  const { lang } = await params;
  const site = getStaticSite();
  if (!site.languages.includes(lang as Lang)) notFound();
  return (
    <SiteShell site={site} lang={lang as Lang} themePreview={process.env.SHOWCASE === "1" ? "always" : undefined}>
      {children}
    </SiteShell>
  );
}
