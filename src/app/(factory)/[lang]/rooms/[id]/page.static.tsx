import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStaticSite } from "@/lib/static-site";
import { t } from "@/lib/format";
import type { Lang } from "@/lib/types";
import { RoomDetail, roomPhotos } from "@/components/RoomDetail";

type Params = Promise<{ lang: string; id: string }>;

export function generateStaticParams() {
  const site = getStaticSite();
  return site.languages.flatMap((lang) => site.rooms.map((r) => ({ lang, id: r.id })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, id } = await params;
  const room = getStaticSite().rooms.find((r) => r.id === id);
  if (!room) return {};
  return {
    title: t(room.name, lang as Lang),
    description: t(room.description, lang as Lang),
    openGraph: { images: roomPhotos(room).slice(0, 1) },
  };
}

export default async function RoomPage({ params }: { params: Params }) {
  const { lang, id } = await params;
  const site = getStaticSite();
  const room = site.rooms.find((r) => r.id === id);
  if (!room) notFound();
  return <RoomDetail site={site} lang={lang as Lang} room={room} />;
}
