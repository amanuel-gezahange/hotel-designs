import { dict, fill } from "@/lib/i18n";
import { price, t, waLink } from "@/lib/format";
import type { Lang, Room, SaveInquiry, SiteConfig } from "@/lib/types";
import { BookingForm } from "./BookingForm";
import { PhotoGrid } from "./PhotoGrid";
import { ButtonLink, Img } from "./ui";

export function roomPhotos(r: Room): string[] {
  const all = [r.image, ...(r.images ?? [])].filter((x): x is string => !!x);
  return [...new Set(all)];
}

/** A room's own page: photo gallery, details, price, and a booking form pre-set to this room. */
export function RoomDetail({
  site,
  lang,
  room,
  slug,
  saveInquiry,
}: {
  site: SiteConfig;
  lang: Lang;
  room: Room;
  slug?: string;
  saveInquiry?: SaveInquiry;
}) {
  const d = dict[lang];
  const photos = roomPhotos(room);
  const others = site.rooms.filter((r) => r.id !== room.id);
  const msg = fill(d.waMessage, { site: site.name, room: t(room.name, lang), in: "", out: "", guests: "", name: "" });

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <a href={`/${lang}/#rooms`} className="text-sm font-semibold text-brand-text hover:underline">
        ← {d.allRooms}
      </a>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          {photos.length ? (
            <PhotoGrid
              images={photos}
              alt={t(room.name, lang)}
              variant="room"
              labels={{ close: d.close, next: d.next, prev: d.prev }}
            />
          ) : (
            <Img className="aspect-[16/10] w-full rounded-[var(--radius)]" />
          )}
        </div>

        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold sm:text-4xl">
            {t(room.name, lang)}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {fill(d.upTo, { n: room.capacity })}
            {room.size ? ` · ${room.size}` : ""}
          </p>
          <p className="mt-5">
            <span className="text-sm text-muted">{d.from} </span>
            <span className="text-3xl font-semibold text-brand-text">{price(room.priceFrom, site.currency, lang)}</span>
            <span className="ml-1 text-sm text-muted">{d.perNight}</span>
          </p>
          <p className="mt-5 leading-relaxed text-muted">{t(room.description, lang)}</p>

          {!!room.features?.length && (
            <>
              <h2 className="mt-6 text-sm font-semibold uppercase tracking-widest text-accent-text">{d.features}</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {room.features.map((f, i) => (
                  <li key={i} className="rounded-full bg-brand-soft px-3 py-1 text-sm">
                    {t(f, lang)}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href={waLink(site, msg)} external>
              {d.requestWhatsApp}
            </ButtonLink>
            <ButtonLink href={`tel:${site.contact.phone}`} variant="outline">
              <span className="text-brand-text">{d.call}</span>
            </ButtonLink>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-xl">
        <BookingForm site={site} lang={lang} slug={slug} saveInquiry={saveInquiry} defaultRoom={room.id} />
      </div>

      {!!others.length && (
        <section className="mt-16">
          <h2 className="mb-5 font-[family-name:var(--font-heading)] text-2xl font-semibold">{d.otherRooms}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((r) => (
              <a key={r.id} href={`/${lang}/rooms/${r.id}`} className="card group overflow-hidden rounded-[var(--radius)] border border-line">
                <Img src={roomPhotos(r)[0]} alt={t(r.name, lang)} className="aspect-[3/2] w-full transition duration-500 group-hover:scale-105" />
                <div className="p-4">
                  <h3 className="font-semibold">{t(r.name, lang)}</h3>
                  <p className="text-sm text-muted">
                    {d.from} {price(r.priceFrom, site.currency, lang)} {d.perNight}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
