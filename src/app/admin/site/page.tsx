import { notFound, redirect } from "next/navigation";
import { getSiteConfig } from "@/lib/db";
import { canManage, requireSession } from "@/lib/auth";
import { Editor } from "./Editor";

export default async function EditSite({ searchParams }: { searchParams: Promise<{ slug?: string }> }) {
  const s = await requireSession();
  const slug = s.role === "super" ? (await searchParams).slug : s.siteSlug;
  if (!slug) redirect("/admin/platform");
  if (!canManage(s, slug)) redirect("/admin");
  const cfg = await getSiteConfig(slug, true);
  if (!cfg) notFound();
  return <Editor slug={slug} initial={cfg} />;
}
