"use client";

import { DownloadButton } from "../DownloadButton";
import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import type { SectionId, SiteConfig } from "@/lib/types";
import { STYLE_LABELS, STYLE_PRESETS } from "@/lib/presets";
import { saveSite } from "../actions";

type Path = (string | number)[];

const TABS = [
  ["general", "General"],
  ["look", "Look & hero"],
  ["contact", "Contact"],
  ["about", "About"],
  ["rooms", "Rooms"],
  ["amenities", "Amenities"],
  ["gallery", "Gallery"],
  ["reviews", "Reviews"],
  ["faq", "FAQ"],
  ["sections", "Page layout"],
] as const;

const ALL_SECTIONS: SectionId[] = ["about", "rooms", "amenities", "gallery", "testimonials", "faq", "contact"];

const input = "w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-800";

function getIn(o: unknown, p: Path): unknown {
  return p.reduce<unknown>((acc, k) => (acc == null ? undefined : (acc as Record<string | number, unknown>)[k]), o);
}
function setIn(o: unknown, p: Path, v: unknown) {
  let cur = o as Record<string | number, unknown>;
  p.slice(0, -1).forEach((k, i) => {
    if (cur[k] == null) cur[k] = typeof p[i + 1] === "number" ? [] : {};
    cur = cur[k] as Record<string | number, unknown>;
  });
  cur[p[p.length - 1]] = v;
}
const asL = (v: unknown): { en: string; am: string } =>
  typeof v === "string"
    ? { en: v, am: "" }
    : { en: (v as { en?: string } | undefined)?.en ?? "", am: (v as { am?: string } | undefined)?.am ?? "" };

/* ------------------------------------------------------------------
 * The field components live OUTSIDE the Editor on purpose: components
 * created inside another component get re-created on every keystroke,
 * which makes inputs lose focus. They read shared state from context.
 * ------------------------------------------------------------------ */
interface Ctx {
  cfg: SiteConfig;
  get: (p: Path) => unknown;
  set: (p: Path, v: unknown) => void;
  hasAm: boolean;
  uploading: boolean;
  upload: (f: File) => Promise<string | null>;
}
const EditorCtx = createContext<Ctx | null>(null);
function useEd(): Ctx {
  const c = useContext(EditorCtx);
  if (!c) throw new Error("Editor context missing");
  return c;
}

function Text({
  label,
  path,
  type = "text",
  hint,
  format,
}: {
  label: string;
  path: Path;
  type?: string;
  hint?: string;
  format?: (v: string) => string;
}) {
  const { get, set } = useEd();
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <input
        type={type}
        className={input}
        value={String(get(path) ?? "")}
        onChange={(e) => {
          const raw = format ? format(e.target.value) : e.target.value;
          set(path, type === "number" ? Number(raw) : raw);
        }}
      />
      {hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
    </label>
  );
}

function LText({ label, path, multi = false }: { label: string; path: Path; multi?: boolean }) {
  const { get, set, hasAm } = useEd();
  const v = asL(get(path));
  const El = multi ? "textarea" : "input";
  const row = multi ? { rows: 3 } : {};
  return (
    <div className="text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <div className={hasAm ? "grid gap-2 sm:grid-cols-2" : ""}>
        <El {...row} className={input} placeholder="English" value={v.en} onChange={(e) => set(path, { ...v, en: e.target.value })} />
        {hasAm && (
          <El {...row} className={input} placeholder="አማርኛ" value={v.am} onChange={(e) => set(path, { ...v, am: e.target.value })} />
        )}
      </div>
    </div>
  );
}

function Photo({ label, path }: { label: string; path: Path }) {
  const { get, set, upload, uploading } = useEd();
  const src = get(path) as string | undefined;
  return (
    <div className="text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <div className="flex items-center gap-3">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="h-16 w-24 rounded object-cover" />
        ) : (
          <div className="grid h-16 w-24 place-items-center rounded bg-stone-200 text-xs text-stone-500">none</div>
        )}
        <label className="cursor-pointer rounded border border-stone-300 bg-white px-3 py-1.5 hover:bg-stone-100">
          {uploading ? "Uploading…" : src ? "Replace" : "Upload"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              const url = await upload(f);
              if (url) set(path, url);
            }}
          />
        </label>
        {src && (
          <button type="button" className="text-xs text-red-600 underline" onClick={() => set(path, undefined)}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

/** Several photos at once (gallery, extra room photos). */
function MultiPhoto({ label, path, size = "h-16 w-20" }: { label: string; path: Path; size?: string }) {
  const { get, set, upload, uploading } = useEd();
  const list = (get(path) as string[] | undefined) ?? [];
  return (
    <div className="text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        {list.map((src, k) => (
          <div key={`${src}-${k}`} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className={`${size} rounded object-cover`} />
            <button
              type="button"
              aria-label="Remove photo"
              className="absolute right-0.5 top-0.5 rounded bg-white/90 px-1.5 text-xs text-red-600"
              onClick={() => set(path, list.filter((_, n) => n !== k))}
            >
              ✕
            </button>
          </div>
        ))}
        <label className="cursor-pointer rounded border border-dashed border-stone-400 px-3 py-1.5 hover:bg-stone-100">
          {uploading ? "Uploading…" : "+ Add photos"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              const urls: string[] = [];
              for (const f of files) {
                const u = await upload(f);
                if (u) urls.push(u);
              }
              if (urls.length) set(path, [...list, ...urls]);
            }}
          />
        </label>
      </div>
    </div>
  );
}

/** Editable list with add / remove / reorder. */
function List({
  path,
  blank,
  title,
  children,
  addLabel,
}: {
  path: Path;
  blank: () => unknown;
  title: (i: number, item: Record<string, unknown>) => string;
  children: (i: number) => ReactNode;
  addLabel: string;
}) {
  const { get, set } = useEd();
  const items = (get(path) as Record<string, unknown>[] | undefined) ?? [];
  const move = (i: number, d: number) => {
    const next = [...items];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    set(path, next);
  };
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">{title(i, item)}</h3>
            <div className="flex gap-1 text-xs">
              <button type="button" className="rounded border px-2 py-1" onClick={() => move(i, -1)}>↑</button>
              <button type="button" className="rounded border px-2 py-1" onClick={() => move(i, 1)}>↓</button>
              <button
                type="button"
                className="rounded border border-red-300 px-2 py-1 text-red-600"
                onClick={() => confirm("Remove this item?") && set(path, items.filter((_, k) => k !== i))}
              >
                Remove
              </button>
            </div>
          </div>
          <div className="space-y-3">{children(i)}</div>
        </div>
      ))}
      <button
        type="button"
        className="rounded border border-dashed border-stone-400 px-4 py-2 text-sm hover:bg-stone-100"
        onClick={() => set(path, [...items, blank()])}
      >
        + {addLabel}
      </button>
    </div>
  );
}

const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9-]+/g, "-");

export function Editor({ slug, initial }: { slug: string; initial: SiteConfig }) {
  const [cfg, setCfg] = useState<SiteConfig>(initial);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("general");
  const [status, setStatus] = useState<{ ok?: boolean; msg: string } | null>(null);
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);

  const set = (p: Path, v: unknown) =>
    setCfg((prev) => {
      const n = structuredClone(prev);
      setIn(n, p, v);
      return n;
    });
  const get = (p: Path) => getIn(cfg, p);

  async function upload(file: File): Promise<string | null> {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/upload?slug=${slug}`, { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Upload failed");
      return j.url as string;
    } catch (e) {
      setStatus({ ok: false, msg: e instanceof Error ? e.message : "Upload failed" });
      return null;
    } finally {
      setUploading(false);
    }
  }

  const save = () =>
    start(async () => {
      setStatus(null);
      const r = await saveSite(slug, JSON.stringify(cfg));
      setStatus(r.error ? { ok: false, msg: r.error } : { ok: true, msg: "Saved. Your website is updated." });
    });

  const toggleLang = (l: "en" | "am") => {
    const has = cfg.languages.includes(l);
    const next = has ? cfg.languages.filter((x) => x !== l) : [...cfg.languages, l];
    if (!next.length) return;
    set(["languages"], next);
    if (!next.includes(cfg.defaultLang)) set(["defaultLang"], next[0]);
  };

  const moveSection = (id: SectionId, d: number) => {
    const s = [...cfg.sections];
    const i = s.indexOf(id);
    const j = i + d;
    if (i < 0 || j < 0 || j >= s.length) return;
    [s[i], s[j]] = [s[j], s[i]];
    set(["sections"], s);
  };
  const toggleSection = (id: SectionId) =>
    set(["sections"], cfg.sections.includes(id) ? cfg.sections.filter((x) => x !== id) : [...cfg.sections, id]);

  const ctx: Ctx = { cfg, get, set, hasAm: cfg.languages.includes("am"), uploading, upload };

  return (
    <EditorCtx.Provider value={ctx}>
      <div>
        <div className="sticky top-0 z-10 -mx-5 mb-6 flex items-center justify-between border-b border-stone-200 bg-stone-50/95 px-5 py-3 lg:-mx-10 lg:px-10 backdrop-blur">
          <h1 className="text-lg font-semibold">Edit website · {slug}</h1>
          <div className="flex items-center gap-3">
            {status && <span className={`text-sm ${status.ok ? "text-emerald-700" : "text-red-600"}`}>{status.msg}</span>}
            <DownloadButton slug={slug} label="Download website" />
            <button
              onClick={save}
              disabled={pending || uploading}
              className="rounded bg-stone-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-full px-4 py-1.5 text-sm ${tab === id ? "bg-stone-900 text-white" : "border border-stone-300 bg-white hover:bg-stone-100"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {tab === "general" && (
            <>
              <Text label="Property name" path={["name"]} />
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Type</span>
                <select className={input} value={cfg.type} onChange={(e) => set(["type"], e.target.value)}>
                  {["hotel", "guesthouse", "lodge", "resort", "apartment"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <LText label="Tagline" path={["tagline"]} />
              <LText label="Short description (shown on Google)" path={["description"]} multi />
              <div className="text-sm">
                <span className="mb-1 block font-medium">Languages</span>
                <div className="flex gap-4">
                  {(["en", "am"] as const).map((l) => (
                    <label key={l} className="flex items-center gap-2">
                      <input type="checkbox" checked={cfg.languages.includes(l)} onChange={() => toggleLang(l)} />
                      {l === "en" ? "English" : "አማርኛ"}
                    </label>
                  ))}
                </div>
              </div>
              {cfg.languages.length > 1 && (
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Default language</span>
                  <select className={input} value={cfg.defaultLang} onChange={(e) => set(["defaultLang"], e.target.value)}>
                    {cfg.languages.map((l) => (
                      <option key={l} value={l}>{l === "en" ? "English" : "አማርኛ"}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Currency</span>
                <select className={input} value={cfg.currency} onChange={(e) => set(["currency"], e.target.value)}>
                  <option value="ETB">ETB (Birr)</option>
                  <option value="USD">USD</option>
                </select>
              </label>
              <Photo label="Logo (optional)" path={["logo"]} />
              <Text label="Website address (optional)" path={["url"]} hint="e.g. https://abaylodge.com, used for Google/SEO" />
            </>
          )}

          {tab === "look" && (
            <>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Website style</span>
                <select
                  className={input}
                  value={cfg.theme.style ?? "classic"}
                  onChange={(e) => set(["theme"], { ...STYLE_PRESETS[e.target.value as keyof typeof STYLE_PRESETS] })}
                >
                  {(Object.keys(STYLE_LABELS) as (keyof typeof STYLE_LABELS)[]).map((k) => (
                    <option key={k} value={k}>{STYLE_LABELS[k]}</option>
                  ))}
                </select>
                <span className="mt-1 block text-xs text-stone-500">
                  Choosing a style resets the colors below to that style&apos;s defaults. Adjust them afterwards. Use the button below to flip through every style on your real content.
                </span>
                <button
                  type="button"
                  className="mt-2 rounded border border-stone-300 px-3 py-1 text-sm hover:bg-stone-100"
                  onClick={() => window.open(`${location.protocol}//${slug}.${location.host}/en?themes`, "_blank")}
                >
                  See all designs
                </button>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["Main color", "brand"],
                    ["Accent color", "accent"],
                  ] as const
                ).map(([label, k]) => (
                  <label key={k} className="block text-sm">
                    <span className="mb-1 block font-medium">{label}</span>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="h-10 w-14 rounded border border-stone-300"
                        value={cfg.theme[k].length === 7 ? cfg.theme[k] : "#000000"}
                        onChange={(e) => set(["theme", k], e.target.value)}
                      />
                      <input className={input} value={cfg.theme[k]} onChange={(e) => set(["theme", k], e.target.value)} />
                    </div>
                  </label>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Corners</span>
                  <select className={input} value={cfg.theme.radius} onChange={(e) => set(["theme", "radius"], e.target.value)}>
                    <option value="none">Sharp</option>
                    <option value="soft">Soft</option>
                    <option value="round">Round</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Heading style</span>
                  <select className={input} value={cfg.theme.headingFont} onChange={(e) => set(["theme", "headingFont"], e.target.value)}>
                    <option value="serif">Elegant (serif)</option>
                    <option value="sans">Modern (sans)</option>
                  </select>
                  <span className="mt-1 block text-xs text-stone-500">Some styles (Editorial, Cinematic, Vibrant, Zen, Safari) bring their own fonts.</span>
                </label>
              </div>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Animations</span>
                <select className={input} value={cfg.theme.motion ?? "on"} onChange={(e) => set(["theme", "motion"], e.target.value)}>
                  <option value="on">On: things fade in as you scroll, slow-zoom banner, counting numbers</option>
                  <option value="off">Off: a still, instant page</option>
                </select>
              </label>
              <Photo label="Hero photo (the big photo at the top)" path={["hero", "image"]} />
              <LText label="Hero title" path={["hero", "title"]} />
              <LText label="Hero subtitle" path={["hero", "subtitle"]} multi />
              <LText label="Button text (optional)" path={["hero", "cta"]} />
            </>
          )}

          {tab === "contact" && (
            <>
              <Text label="Phone number" path={["contact", "phone"]} hint="e.g. +251911000000" />
              <Text
                label="WhatsApp number"
                path={["contact", "whatsapp"]}
                hint="Digits only with country code, e.g. 251911000000. Booking requests are sent here."
                format={(v) => v.replace(/\D/g, "")}
              />
              <Text label="Email" path={["contact", "email"]} type="email" />
              <LText label="Address" path={["contact", "address"]} />
              <Text label="City" path={["contact", "city"]} />
              <Text label="Google Maps link" path={["contact", "mapsUrl"]} hint="Shown as the “Get directions” button" />
              <Text label="Google Maps embed link (optional)" path={["contact", "mapEmbedUrl"]} hint="Google Maps → Share → Embed a map → copy the src=… address (must start with https://)" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Text label="Check-in time" path={["contact", "checkIn"]} />
                <Text label="Check-out time" path={["contact", "checkOut"]} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Text label="Facebook link" path={["social", "facebook"]} />
                <Text label="Instagram link" path={["social", "instagram"]} />
                <Text label="TikTok link" path={["social", "tiktok"]} />
              </div>
            </>
          )}

          {tab === "about" && (
            <>
              <LText label="Section title" path={["about", "title"]} />
              <Photo label="Photo" path={["about", "image"]} />
              <h3 className="pt-2 font-semibold">Paragraphs</h3>
              <List path={["about", "body"]} blank={() => ({ en: "", am: "" })} title={(i) => `Paragraph ${i + 1}`} addLabel="Add paragraph">
                {(i) => <LText label="Text" path={["about", "body", i]} multi />}
              </List>
              <h3 className="pt-2 font-semibold">Highlights (numbers)</h3>
              <List
                path={["about", "highlights"]}
                blank={() => ({ value: "", label: { en: "", am: "" } })}
                title={(i) => `Highlight ${i + 1}`}
                addLabel="Add highlight"
              >
                {(i) => (
                  <>
                    <Text label="Number" path={["about", "highlights", i, "value"]} />
                    <LText label="Label" path={["about", "highlights", i, "label"]} />
                  </>
                )}
              </List>
            </>
          )}

          {tab === "rooms" && (
            <List
              path={["rooms"]}
              addLabel="Add room"
              blank={() => ({
                id: `room-${Date.now().toString(36)}`,
                name: { en: "New room", am: "" },
                description: { en: "", am: "" },
                priceFrom: 0,
                capacity: 2,
                features: [],
              })}
              title={(i, r) => asL(r.name).en || `Room ${i + 1}`}
            >
              {(i) => (
                <>
                  <LText label="Room name" path={["rooms", i, "name"]} />
                  <LText label="Description" path={["rooms", i, "description"]} multi />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Text label={`Price per night (${cfg.currency})`} path={["rooms", i, "priceFrom"]} type="number" />
                    <Text label="Max guests" path={["rooms", i, "capacity"]} type="number" />
                    <Text label="Size (optional)" path={["rooms", i, "size"]} hint="e.g. 25 m²" />
                  </div>
                  <Photo label="Main photo" path={["rooms", i, "image"]} />
                  <MultiPhoto label="More photos (shown on this room's own page)" path={["rooms", i, "images"]} />
                  <Text
                    label="Page address"
                    path={["rooms", i, "id"]}
                    hint="Letters, numbers and dashes only. It becomes the room's web address (/rooms/this-name). Each room needs a different one."
                    format={slugify}
                  />
                  <h4 className="text-sm font-medium">Feature tags</h4>
                  <List path={["rooms", i, "features"]} blank={() => ({ en: "", am: "" })} title={(k) => `Tag ${k + 1}`} addLabel="Add tag">
                    {(k) => <LText label="Tag" path={["rooms", i, "features", k]} />}
                  </List>
                </>
              )}
            </List>
          )}

          {tab === "amenities" && (
            <List
              path={["amenities"]}
              addLabel="Add amenity"
              blank={() => ({ icon: "✨", title: { en: "", am: "" } })}
              title={(_, a) => `${a.icon ?? ""} ${asL(a.title).en}`}
            >
              {(i) => (
                <>
                  <Text label="Icon (any emoji)" path={["amenities", i, "icon"]} />
                  <LText label="Title" path={["amenities", i, "title"]} />
                  <LText label="Details (optional)" path={["amenities", i, "text"]} />
                </>
              )}
            </List>
          )}

          {tab === "gallery" && <MultiPhoto label="Gallery photos" path={["gallery"]} size="h-24 w-24" />}

          {tab === "reviews" && (
            <List
              path={["testimonials"]}
              addLabel="Add review"
              blank={() => ({ name: "", from: "", rating: 5, text: { en: "", am: "" } })}
              title={(i, x) => String(x.name || `Review ${i + 1}`)}
            >
              {(i) => (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Text label="Guest name" path={["testimonials", i, "name"]} />
                    <Text label="From (optional)" path={["testimonials", i, "from"]} />
                    <Text label="Stars (1-5)" path={["testimonials", i, "rating"]} type="number" />
                  </div>
                  <LText label="Review" path={["testimonials", i, "text"]} multi />
                </>
              )}
            </List>
          )}

          {tab === "faq" && (
            <List
              path={["faq"]}
              addLabel="Add question"
              blank={() => ({ q: { en: "", am: "" }, a: { en: "", am: "" } })}
              title={(i, f) => asL(f.q).en || `Question ${i + 1}`}
            >
              {(i) => (
                <>
                  <LText label="Question" path={["faq", i, "q"]} />
                  <LText label="Answer" path={["faq", i, "a"]} multi />
                </>
              )}
            </List>
          )}

          {tab === "sections" && (
            <div className="space-y-2 text-sm">
              <p className="text-stone-600">Choose which sections appear and their order. Sections with no content stay hidden.</p>
              {[...cfg.sections, ...ALL_SECTIONS.filter((s) => !cfg.sections.includes(s))].map((id) => {
                const on = cfg.sections.includes(id);
                return (
                  <div key={id} className="flex items-center justify-between rounded border border-stone-200 bg-white px-4 py-2">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" checked={on} disabled={id === "contact"} onChange={() => toggleSection(id)} />
                      <span className="capitalize">{id === "testimonials" ? "reviews" : id}</span>
                    </label>
                    {on && (
                      <div className="flex gap-1">
                        <button type="button" className="rounded border px-2 py-1" onClick={() => moveSection(id, -1)}>↑</button>
                        <button type="button" className="rounded border px-2 py-1" onClick={() => moveSection(id, 1)}>↓</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </EditorCtx.Provider>
  );
}
