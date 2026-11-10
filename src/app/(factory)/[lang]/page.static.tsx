import { getStaticSite } from "@/lib/static-site";
import type { Lang } from "@/lib/types";
import { SiteHome } from "@/components/SiteHome";

export function generateStaticParams() {
  return getStaticSite().languages.map((lang) => ({ lang }));
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <SiteHome site={getStaticSite()} lang={lang as Lang} />;
}
