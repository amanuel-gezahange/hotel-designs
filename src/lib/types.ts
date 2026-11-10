export type Lang = "en" | "am";

export type Style =
  | "classic"
  | "modern"
  | "resort"
  | "heritage"
  | "luxe"
  | "editorial"
  | "immersive"
  | "vibrant"
  | "zen"
  | "safari"
  | "moodboard"
  | "scrapbook"
  | "aurora"
  | "academia"
  | "retro";

/** Plain string (same in all languages) or per-language text. */
export type L = string | { en: string; am?: string };

export type SectionId =
  | "about"
  | "rooms"
  | "amenities"
  | "gallery"
  | "testimonials"
  | "faq"
  | "contact";

export interface Room {
  id: string;
  name: L;
  description: L;
  /** Price per night, in the site's currency. */
  priceFrom: number;
  capacity: number;
  size?: string;
  image?: string;
  /** Extra photos for the room page (the first one is used as the main photo if `image` is empty). */
  images?: string[];
  features?: L[];
}

export interface SiteConfig {
  name: string;
  type: "hotel" | "guesthouse" | "lodge" | "resort" | "apartment";
  /** Public URL, used for SEO/sitemap. */
  url?: string;
  tagline: L;
  description: L;
  defaultLang: Lang;
  languages: Lang[];
  currency: "ETB" | "USD";
  logo?: string;
  theme: {
    /** Visual style preset: changes layout details (hero, cards, headings). */
    style?: Style;
    /** Scroll animations, slow-zoom hero, count-up numbers. Default "on". */
    motion?: "on" | "off";
    brand: string;
    accent: string;
    ink?: string;
    paper?: string;
    radius: "none" | "soft" | "round";
    headingFont: "serif" | "sans";
  };
  contact: {
    phone: string;
    /** International format, digits only, e.g. 251911000000 */
    whatsapp: string;
    telegram?: string;
    email?: string;
    address: L;
    city: string;
    mapsUrl?: string;
    mapEmbedUrl?: string;
    checkIn?: string;
    checkOut?: string;
  };
  social?: { facebook?: string; instagram?: string; tiktok?: string };
  hero: { image?: string; title?: L; subtitle: L; cta?: L };
  about?: {
    title: L;
    body: L[];
    image?: string;
    highlights?: { value: string; label: L }[];
  };
  rooms: Room[];
  amenities?: { icon: string; title: L; text?: L }[];
  gallery?: string[];
  testimonials?: { name: string; from?: string; text: L; rating: number }[];
  faq?: { q: L; a: L }[];
  /** Order of sections on the home page. Remove an id to hide a section. */
  sections: SectionId[];
}

export interface InquiryInput {
  slug: string;
  name: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  room: string;
  website?: string; // honeypot: real users never fill this
}

/** Optional: saves a booking request somewhere. Absent in standalone (factory) sites. */
export type SaveInquiry = (i: InquiryInput) => Promise<unknown>;
