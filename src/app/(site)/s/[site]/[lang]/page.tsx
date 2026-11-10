import { notFound } from "next/navigation";
import { getSite } from "@/lib/site";
import type { Lang } from "@/lib/types";
import { SiteHome } from "@/components/SiteHome";
import { submitInquiry } from "../actions";

// Re-generated at most every 5 minutes, and immediately when the owner saves (revalidatePath).
export const revalidate = 300;

export default async function Home({
  params,
}: {
  params: Promise<{ site: string; lang: string }>;
}) {
  const { lang, site: slug } = await params;
  const site = await getSite(slug);
  if (!site.languages.includes(lang as Lang)) notFound();
  return <SiteHome site={site} lang={lang as Lang} slug={slug} saveInquiry={submitInquiry} />;
}
