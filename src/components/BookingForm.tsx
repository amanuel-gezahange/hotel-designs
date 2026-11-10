"use client";

import { useState } from "react";
import { dict, fill } from "@/lib/i18n";
import { t, waLink } from "@/lib/format";
import type { Lang, SaveInquiry, SiteConfig } from "@/lib/types";

/**
 * No backend needed: builds a pre-filled WhatsApp message to the property.
 * Most Ethiopian guests already book this way, and it works on any hosting.
 */
export function BookingForm({
  site,
  lang,
  slug,
  saveInquiry,
  defaultRoom = "",
}: {
  site: SiteConfig;
  lang: Lang;
  slug?: string;
  saveInquiry?: SaveInquiry;
  defaultRoom?: string;
}) {
  const d = dict[lang];
  const [f, setF] = useState({ name: "", phone: "", in: "", out: "", guests: "2", room: defaultRoom, website: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const room = site.rooms.find((r) => r.id === f.room);
    const msg = fill(d.waMessage, {
      site: site.name,
      room: room ? t(room.name, lang) : d.anyRoom,
      in: f.in,
      out: f.out,
      guests: f.guests,
      name: f.name,
    });
    // Hosted mode only: also save the request in the owner's inbox (not awaited, so WhatsApp opens instantly)
    void saveInquiry?.({
      slug: slug ?? "",
      name: f.name,
      phone: f.phone,
      checkIn: f.in,
      checkOut: f.out,
      guests: Number(f.guests),
      room: room ? t(room.name, lang) : "",
      website: f.website,
    });
    window.open(waLink(site, msg), "_blank", "noopener");
  };

  const field =
    "w-full rounded-[var(--radius)] border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-brand";
  const label = "mb-1 block text-xs font-semibold text-muted";

  return (
    <form onSubmit={submit} className="rounded-[var(--radius)] border border-line bg-paper p-6 shadow-sm">
      <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold">{d.bookTitle}</h3>
      <p className="mb-5 text-sm text-muted">{d.bookHint}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className={label}>{d.yourName}</span>
          <input required maxLength={100} autoComplete="name" className={field} value={f.name} onChange={set("name")} />
        </label>
        <label>
          <span className={label}>{d.phone}</span>
          <input
            type="tel"
            inputMode="tel"
            maxLength={25}
            autoComplete="tel"
            className={field}
            value={f.phone}
            onChange={(e) => setF({ ...f, phone: e.target.value.replace(/[^0-9+ ()-]/g, "") })}
          />
        </label>
        {/* honeypot */}
        <input
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="hidden"
          name="website"
          value={f.website}
          onChange={set("website")}
        />
        <label>
          <span className={label}>{d.checkIn}</span>
          <input required type="date" className={field} value={f.in} onChange={set("in")} />
        </label>
        <label>
          <span className={label}>{d.checkOut}</span>
          <input required type="date" min={f.in} className={field} value={f.out} onChange={set("out")} />
        </label>
        <label>
          <span className={label}>{d.guests}</span>
          <input type="number" min={1} max={50} className={field} value={f.guests} onChange={set("guests")} />
        </label>
        <label>
          <span className={label}>{d.room}</span>
          <select className={field} value={f.room} onChange={set("room")}>
            <option value="">{d.anyRoom}</option>
            {site.rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {t(r.name, lang)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="submit"
        className="mt-5 w-full rounded-[var(--radius)] bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
      >
        {d.requestWhatsApp}
      </button>
    </form>
  );
}
