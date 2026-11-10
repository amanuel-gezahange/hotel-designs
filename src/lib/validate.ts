import { z } from "zod";
import { STYLE_ORDER } from "./presets";
import type { SectionId, SiteConfig, Style } from "./types";

/**
 * One strict definition of what a hotel site file may contain.
 * Used when the visual editor saves AND when the factory builds a site.json,
 * so a typo or bad value is caught with a clear message instead of breaking the page.
 * Unknown fields are dropped.
 */

const SECTIONS = ["about", "rooms", "amenities", "gallery", "testimonials", "faq", "contact"] as const satisfies readonly SectionId[];

const str = (max: number) => z.string().max(max);

/** Text shown to guests: same in every language, or per-language. */
const text = z.union([str(4000), z.object({ en: str(4000), am: str(4000).optional() })]);

const color = z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i, "must be a color like #1f4d3a");

/** Links people can click: https only (no javascript:, data:, etc.). Empty = not set. */
const link = z.union([z.literal(""), z.string().max(2000).regex(/^https?:\/\/[^\s"'<>]+$/i, "must be a full link starting with https://")]);
const httpsLink = z.union([z.literal(""), z.string().max(2000).regex(/^https:\/\/[^\s"'<>]+$/i, "must start with https://")]);

/** A photo: one of our own files (/images/x.webp, /uploads/...) or an https link. */
const photo = z.string().max(2000).regex(/^(\/(?!\/)(?!.*\.\.)[A-Za-z0-9._~%/-]+|https:\/\/[^\s"'<>]+)$/, "must be an uploaded photo or an https link (no spaces)");

const room = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,60}$/, "page address must use only lowercase letters, numbers and dashes"),
  name: text,
  description: text,
  priceFrom: z.coerce.number().min(0, "price can't be negative").max(100_000_000),
  capacity: z.coerce.number().min(1).max(100).transform(Math.round),
  size: str(30).optional(),
  image: photo.optional(),
  images: z.array(photo).max(40).optional(),
  features: z.array(text).max(30).optional(),
});

const siteSchema = z.object({
  name: z.string().trim().min(1, "Property name is required").max(100),
  type: z.enum(["hotel", "guesthouse", "lodge", "resort", "apartment"]),
  url: httpsLink.optional(),
  tagline: text,
  description: text,
  defaultLang: z.enum(["en", "am"]),
  languages: z.array(z.enum(["en", "am"])).min(1, "pick at least one language").max(2),
  currency: z.enum(["ETB", "USD"]),
  logo: photo.optional(),
  theme: z.object({
    style: z.enum(STYLE_ORDER as [Style, ...Style[]]).optional(),
    motion: z.enum(["on", "off"]).optional(),
    brand: color,
    accent: color,
    ink: color.optional(),
    paper: color.optional(),
    radius: z.enum(["none", "soft", "round"]),
    headingFont: z.enum(["serif", "sans"]),
  }),
  contact: z.object({
    phone: z.string().regex(/^\+?[0-9 ()-]{5,25}$/, "phone can only contain digits, spaces, + ( ) -"),
    whatsapp: z.string().regex(/^\d{9,15}$/, "digits only with country code, e.g. 251911000000"),
    telegram: str(100).optional(),
    email: z.union([z.literal(""), z.email().max(254)]).optional(),
    address: text,
    city: str(100),
    mapsUrl: link.optional(),
    mapEmbedUrl: httpsLink.optional(),
    checkIn: str(20).optional(),
    checkOut: str(20).optional(),
  }),
  social: z.object({ facebook: link.optional(), instagram: link.optional(), tiktok: link.optional() }).optional(),
  hero: z.object({ image: photo.optional(), title: text.optional(), subtitle: text, cta: text.optional() }),
  about: z
    .object({
      title: text,
      body: z.array(text).max(20),
      image: photo.optional(),
      highlights: z.array(z.object({ value: str(20), label: text })).max(8).optional(),
    })
    .optional(),
  rooms: z.array(room).max(60),
  amenities: z.array(z.object({ icon: str(16), title: text, text: text.optional() })).max(60).optional(),
  gallery: z.array(photo).max(100).optional(),
  testimonials: z
    .array(
      z.object({
        name: str(100),
        from: str(100).optional(),
        text,
        rating: z.coerce.number().min(1).max(5).transform(Math.round),
      }),
    )
    .max(50)
    .optional(),
  faq: z.array(z.object({ q: text, a: text })).max(50).optional(),
  sections: z.array(z.enum(SECTIONS)).max(10),
});

/** "rooms › 2 › id" → "rooms › #3 › id" */
const where = (path: PropertyKey[]) => path.map((p) => (typeof p === "number" ? `#${p + 1}` : String(p))).join(" › ");

/** Validate and clean a site config. Throws Error with a readable message on the first problem. */
export function parseSiteConfig(input: unknown): SiteConfig {
  if (!input || typeof input !== "object") throw new Error("Invalid data");
  if (JSON.stringify(input).length > 400_000) throw new Error("Too much content in one save");

  const r = siteSchema.safeParse(input);
  if (!r.success) {
    const i = r.error.issues[0];
    throw new Error(`${where(i.path)}: ${i.message}`);
  }
  const c = r.data as unknown as SiteConfig;

  if (!c.languages.includes(c.defaultLang)) c.defaultLang = c.languages[0];

  const ids = new Set<string>();
  c.rooms.forEach((rm, i) => {
    if (ids.has(rm.id)) throw new Error(`rooms › #${i + 1} › id: "${rm.id}" is used twice. Each room needs its own page address`);
    ids.add(rm.id);
  });

  c.sections = [...new Set(c.sections)];
  if (!c.sections.includes("contact")) c.sections.push("contact");
  return c;
}

/** Used by the hosted editor's save. */
export const sanitizeConfig = parseSiteConfig;

/* ---------------- other small validators ---------------- */

/** "https://www.AbayLodge.com/" -> "abaylodge.com"; null if empty or not a plausible hostname. */
export function normalizeDomain(input: string): string | null {
  const d = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
  if (d.length > 253) return null;
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(d) ? d : null;
}

/** Folder / web-address name for a client. */
export const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])$/;

/** Names that would clash with the platform's own addresses. */
const RESERVED = new Set(["www", "admin", "api", "app", "mail", "uploads", "s", "static", "assets", "login", "platform"]);
export const isReservedSlug = (s: string) => RESERVED.has(s);
