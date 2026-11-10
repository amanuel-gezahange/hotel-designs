import { dict, fill } from "@/lib/i18n";
import { price, t, waLink } from "@/lib/site";
import type { Lang, SaveInquiry, SectionId, SiteConfig } from "@/lib/types";
import { BookingForm } from "../BookingForm";
import { PhotoGrid } from "../PhotoGrid";
import { roomPhotos } from "../RoomDetail";
import { ButtonLink, Img, Section } from "../ui";

type P = { site: SiteConfig; lang: Lang; slug?: string; saveInquiry?: SaveInquiry };

function About({ site, lang }: P) {
  const a = site.about;
  if (!a) return null;
  return (
    <Section id="about" title={t(a.title, lang)} eyebrow={dict[lang].about}>
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div data-reveal className="about-text space-y-4 text-lg leading-relaxed text-muted">
          {a.body.map((p, i) => (
            <p key={i}>{t(p, lang)}</p>
          ))}
          {a.highlights && (
            <dl className="grid grid-cols-3 gap-4 pt-4">
              {a.highlights.map((h, i) => (
                <div key={i}>
                  <dt data-count className="font-[family-name:var(--font-heading)] text-3xl font-semibold text-brand-text">
                    {h.value}
                  </dt>
                  <dd className="text-sm">{t(h.label, lang)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div data-reveal className="about-media">
          <Img src={a.image} className="aspect-[4/3] w-full rounded-[var(--radius)]" alt={site.name} />
        </div>
      </div>
    </Section>
  );
}

function Rooms({ site, lang }: P) {
  const d = dict[lang];
  if (!site.rooms.length) return null;
  return (
    <Section id="rooms" title={d.rooms} eyebrow={t(site.tagline, lang)} tint>
      <div className="rooms-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {site.rooms.map((r, i) => (
          <article
            key={r.id}
            data-reveal
            style={{ "--i": i } as React.CSSProperties}
            className="card room-card flex flex-col overflow-hidden rounded-[var(--radius)] border border-line bg-paper shadow-sm"
          >
            <a href={`/${lang}/rooms/${r.id}`} className="group block overflow-hidden">
              <Img
                src={roomPhotos(r)[0]}
                alt={t(r.name, lang)}
                className="aspect-[3/2] w-full transition duration-500 group-hover:scale-105"
              />
            </a>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold">
                <a href={`/${lang}/rooms/${r.id}`} className="hover:underline">
                  {t(r.name, lang)}
                </a>
              </h3>
              <p className="mt-1 text-xs text-muted">
                {fill(d.upTo, { n: r.capacity })}
                {r.size ? ` · ${r.size}` : ""}
              </p>
              <p className="mt-3 text-sm text-muted">{t(r.description, lang)}</p>
              {r.features && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {r.features.map((f, i) => (
                    <li key={i} className="rounded-full bg-brand-soft px-3 py-1 text-xs">
                      {t(f, lang)}
                    </li>
                  ))}
                </ul>
              )}
              <a href={`/${lang}/rooms/${r.id}`} className="mt-3 text-sm font-semibold text-brand-text hover:underline">
                {d.details} →
              </a>
              <div className="mt-auto flex items-end justify-between pt-5">
                <p>
                  <span className="text-xs text-muted">{d.from} </span>
                  <span className="text-xl font-semibold text-brand-text">
                    {price(r.priceFrom, site.currency, lang)}
                  </span>
                  <span className="block text-xs text-muted">{d.perNight}</span>
                </p>
                <ButtonLink
                  external
                  href={waLink(
                    site,
                    fill(dict[lang].waMessage, {
                      site: site.name,
                      room: t(r.name, lang),
                      in: "",
                      out: "",
                      guests: "",
                      name: "",
                    }),
                  )}
                >
                  {d.bookRoom}
                </ButtonLink>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

function Amenities({ site, lang }: P) {
  if (!site.amenities?.length) return null;
  const card = (a: NonNullable<SiteConfig["amenities"]>[number], i: number, extra = "") => (
    <div
      key={`${extra}${i}`}
      data-reveal
      style={{ "--i": i } as React.CSSProperties}
      className={`card rounded-[var(--radius)] border border-line p-5 ${extra}`}
      {...(extra ? { "aria-hidden": true } : {})}
    >
      <div className="text-3xl">{a.icon}</div>
      <h3 className="mt-3 font-semibold">{t(a.title, lang)}</h3>
      {a.text && <p className="mt-1 text-sm text-muted">{t(a.text, lang)}</p>}
    </div>
  );
  return (
    <Section id="amenities" title={dict[lang].amenities}>
      <div className="amenities-wrap">
        <div className="amenities-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {site.amenities.map((a, i) => card(a, i))}
          {/* second copy: only shown by styles that scroll the amenities like a ticker */}
          {site.amenities.map((a, i) => card(a, i, "amenity-dup"))}
        </div>
      </div>
    </Section>
  );
}

function Gallery({ site, lang }: P) {
  const d = dict[lang];
  if (!site.gallery?.length) return null;
  return (
    <Section id="gallery" title={d.gallery} tint>
      <PhotoGrid
        images={site.gallery}
        alt={site.name}
        labels={{ close: d.close, next: d.next, prev: d.prev }}
      />
    </Section>
  );
}

function Testimonials({ site, lang }: P) {
  if (!site.testimonials?.length) return null;
  return (
    <Section id="testimonials" title={dict[lang].testimonials}>
      <div className="grid gap-6 md:grid-cols-3">
        {site.testimonials.map((x, i) => (
          <figure key={i} data-reveal style={{ "--i": i } as React.CSSProperties} className="card rounded-[var(--radius)] bg-brand-soft p-6">
            <div className="text-accent-text" aria-label={`${x.rating}/5`}>
              {"★".repeat(x.rating)}
              <span className="text-line">{"★".repeat(5 - x.rating)}</span>
            </div>
            <blockquote className="mt-3 text-muted">“{t(x.text, lang)}”</blockquote>
            <figcaption className="mt-4 text-sm font-semibold">
              {x.name}
              {x.from && <span className="font-normal text-muted"> · {x.from}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}

function Faq({ site, lang }: P) {
  if (!site.faq?.length) return null;
  return (
    <Section id="faq" title={dict[lang].faq} tint>
      <div data-reveal className="mx-auto max-w-3xl divide-y divide-line rounded-[var(--radius)] border border-line bg-paper">
        {site.faq.map((f, i) => (
          <details key={i} className="group p-5">
            <summary className="cursor-pointer list-none font-semibold">{t(f.q, lang)}</summary>
            <p className="mt-2 text-muted">{t(f.a, lang)}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

function Contact({ site, lang, slug, saveInquiry }: P) {
  const d = dict[lang];
  const c = site.contact;
  const rows: [string, React.ReactNode][] = [
    [d.address, t(c.address, lang)],
    [d.phone, <a key="p" href={`tel:${c.phone}`} className="text-brand-text underline">{c.phone}</a>],
  ];
  if (c.email)
    rows.push([d.email, <a key="e" href={`mailto:${c.email}`} className="text-brand-text underline">{c.email}</a>]);
  if (c.checkIn) rows.push([d.checkInTime, c.checkIn]);
  if (c.checkOut) rows.push([d.checkOutTime, c.checkOut]);

  return (
    <Section id="contact" title={d.contact} eyebrow={d.book}>
      <div className="grid gap-10 lg:grid-cols-2">
        <div data-reveal>
          <BookingForm site={site} lang={lang} slug={slug} saveInquiry={saveInquiry} />
          <dl className="mt-8 space-y-3 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex gap-4">
                <dt className="w-28 shrink-0 font-semibold">{k}</dt>
                <dd className="text-muted">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href={`tel:${c.phone}`}>{d.call}</ButtonLink>
            {c.mapsUrl && (
              <ButtonLink href={c.mapsUrl} external variant="outline">
                {d.directions}
              </ButtonLink>
            )}
          </div>
        </div>
        {c.mapEmbedUrl ? (
          <iframe
            src={c.mapEmbedUrl}
            sandbox="allow-scripts allow-same-origin allow-popups"
            referrerPolicy="no-referrer"
            title="Map"
            loading="lazy"
            className="min-h-80 w-full rounded-[var(--radius)] border border-line"
          />
        ) : (
          <Img className="min-h-80 w-full rounded-[var(--radius)]" />
        )}
      </div>
    </Section>
  );
}

export type SectionProps = P;
export const sectionMap: Record<SectionId, (p: P) => React.ReactNode> = {
  about: About,
  rooms: Rooms,
  amenities: Amenities,
  gallery: Gallery,
  testimonials: Testimonials,
  faq: Faq,
  contact: Contact,
};
