import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSite, t } from "@/lib/site";
import type { Lang } from "@/lib/types";
import { RoomDetail, roomPhotos } from "@/components/RoomDetail";
import { submitInquiry } from "../../../actions";

export const revalidate = 300;
type Params = Promise<{ site: string; lang: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { site: slug, lang, id } = await params;
  const site = await getSite(slug);
  const room = site.rooms.find((r) => r.id === id);
  if (!room) return {};
  return {
    title: t(room.name, lang as Lang),
    description: t(room.description, lang as Lang),
    openGraph: { images: roomPhotos(room).slice(0, 1) },
  };
}

export default async function RoomPage({ params }: { params: Params }) {
  const { site: slug, lang, id } = await params;
  const site = await getSite(slug);
  const room = site.rooms.find((r) => r.id === id);
  if (!room || !site.languages.includes(lang as Lang)) notFound();
  return <RoomDetail site={site} lang={lang as Lang} room={room} slug={slug} saveInquiry={submitInquiry} />;
}
