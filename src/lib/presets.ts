import type { SiteConfig, Style } from "./types";

type Theme = SiteConfig["theme"];

/** The 5 looks a client can choose from. Order here = order in the theme switcher. */
export const STYLE_ORDER: Style[] = ["classic", "modern", "resort", "heritage", "luxe", "editorial", "immersive", "vibrant", "zen", "safari", "moodboard", "scrapbook", "aurora", "academia", "retro"];

/** Starting colors and shapes for each style. A client can still override any value afterwards. */
export const STYLE_PRESETS: Record<Style, Theme> = {
  classic: { style: "classic", brand: "#1f4d3a", accent: "#c8963e", paper: "#fbf9f5", radius: "soft", headingFont: "serif" },
  modern: { style: "modern", brand: "#0f172a", accent: "#f97316", paper: "#ffffff", radius: "soft", headingFont: "sans" },
  resort: { style: "resort", brand: "#0e5a6b", accent: "#e8a13a", paper: "#fffaf0", radius: "round", headingFont: "serif" },
  heritage: { style: "heritage", brand: "#0b5d3b", accent: "#e0a100", paper: "#fffaf0", ink: "#2a1d14", radius: "soft", headingFont: "serif" },
  luxe: { style: "luxe", brand: "#c9a45c", accent: "#e7d3a1", paper: "#14110f", ink: "#f3ede2", radius: "none", headingFont: "serif" },
  editorial: { style: "editorial", brand: "#161616", accent: "#d62828", paper: "#faf7f2", ink: "#161616", radius: "none", headingFont: "serif" },
  immersive: { style: "immersive", brand: "#ff7a30", accent: "#ffd166", paper: "#0b0f14", ink: "#eef2f6", radius: "soft", headingFont: "sans" },
  vibrant: { style: "vibrant", brand: "#6d28d9", accent: "#ff5d8f", paper: "#fff8e1", ink: "#1b1530", radius: "round", headingFont: "sans" },
  zen: { style: "zen", brand: "#3d5a4c", accent: "#b08968", paper: "#f7f5f0", ink: "#2b2b2b", radius: "round", headingFont: "serif" },
  safari: { style: "safari", brand: "#9a4f2a", accent: "#d9a441", paper: "#f4ebdd", ink: "#3b2a1e", radius: "round", headingFont: "serif" },
  moodboard: { style: "moodboard", brand: "#e60023", accent: "#ff8fa3", paper: "#f6f3ef", ink: "#211922", radius: "round", headingFont: "sans" },
  scrapbook: { style: "scrapbook", brand: "#c8445a", accent: "#edae49", paper: "#f4ead3", ink: "#3a2e24", radius: "soft", headingFont: "sans" },
  aurora: { style: "aurora", brand: "#7c3aed", accent: "#ec4899", paper: "#f4f1ff", ink: "#1e1b3a", radius: "round", headingFont: "sans" },
  academia: { style: "academia", brand: "#24402f", accent: "#a67c3d", paper: "#eadfc8", ink: "#2b2117", radius: "none", headingFont: "serif" },
  retro: { style: "retro", brand: "#c2410c", accent: "#e9a23b", paper: "#fbf0dc", ink: "#3b1f14", radius: "round", headingFont: "serif" },
};

export const STYLE_NAMES: Record<Style, string> = {
  classic: "Classic",
  modern: "Modern",
  resort: "Resort",
  heritage: "Heritage",
  luxe: "Luxe",
  editorial: "Editorial",
  immersive: "Cinematic",
  vibrant: "Vibrant",
  zen: "Zen",
  safari: "Safari",
  moodboard: "Moodboard",
  scrapbook: "Scrapbook",
  aurora: "Aurora",
  academia: "Academia",
  retro: "Retro",
};

export const STYLE_LABELS: Record<Style, string> = {
  classic: "Classic: warm, traditional, left-aligned",
  modern: "Modern: clean, bold, bright",
  resort: "Resort: airy, centered, relaxed",
  heritage: "Heritage: Ethiopian colors, warm and proud",
  luxe: "Luxe: dark, elegant, gold details",
  editorial: "Editorial: magazine layout, big type, split banner",
  immersive: "Cinematic: full-screen, parallax, swipeable rooms",
  vibrant: "Vibrant: playful, bold colors, bouncy",
  zen: "Zen: minimal, calm, lots of space",
  safari: "Safari: earthy, arch shapes, warm textures",
  moodboard: "Moodboard: Pinterest-style masonry pins, red Save badges",
  scrapbook: "Scrapbook: polaroids, tape, handwritten notes",
  aurora: "Aurora: dreamy glass cards over a drifting glow",
  academia: "Academia: parchment, double frames, vintage photos",
  retro: "Retro: 70s sunset, stripes, circular photo",
};

const RADIUS = { none: "0px", soft: "0.5rem", round: "1.25rem" } as const;

/* ---- colour maths (used for readable text) ---- */
type RGB = [number, number, number];
export function hexToRgb(hex: string): RGB {
  let h = hex.replace("#", "");
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
}
const toHex = (c: RGB) => "#" + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
export function luminance(hex: string): number {
  const lin = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = hexToRgb(hex).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** WCAG contrast ratio between two colours (1 = same, 21 = black on white). */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
/** Blend colour `a` toward `b` by t (0..1), like CSS color-mix. */
export function mixHex(a: string, b: string, t: number): string {
  const [x, y] = [hexToRgb(a), hexToRgb(b)];
  return toHex(x.map((v, i) => v * (1 - t) + y[i] * t) as RGB);
}

const DARK = "#14110f";
/** Black or white, whichever is easier to read on top of this colour (for buttons). */
export function readableOn(hex: string): string {
  return contrast(hex, DARK) > contrast(hex, "#ffffff") ? DARK : "#ffffff";
}

/**
 * A version of `color` that is easy to read as small text on `paper`:
 * if it already passes, keep it; otherwise blend it toward the text colour until it does.
 */
export function readableText(color: string, paper: string, ink: string, min = 4.5): string {
  if (contrast(color, paper) >= min) return color;
  for (let t = 0.06; t <= 1; t += 0.06) {
    const c = mixHex(color, ink, t);
    if (contrast(c, paper) >= min) return c;
  }
  return ink;
}

/** Every CSS variable a theme controls. Used by the page frame AND the live theme switcher. */
export function themeVars(theme: Theme): Record<string, string> {
  const ink = theme.ink ?? "#1c1917";
  const paper = theme.paper ?? "#fbf9f5";
  return {
    "--brand": theme.brand,
    "--accent": theme.accent,
    "--ink": ink,
    "--paper": paper,
    "--brand-text": readableText(theme.brand, paper, ink),
    "--accent-text": readableText(theme.accent, paper, ink),
    "--on-brand": readableOn(theme.brand),
    "--on-accent": readableOn(theme.accent),
    "--radius": RADIUS[theme.radius],
  };
}

/**
 * Decide what a finger/mouse swipe means: 1 = next theme, -1 = previous, 0 = not a swipe.
 * Must be clearly horizontal and quick, so normal scrolling never triggers it.
 */
export function swipeDir(dx: number, dy: number, ms: number): 1 | -1 | 0 {
  if (ms > 700 || Math.abs(dx) < 70 || Math.abs(dy) > 50 || Math.abs(dx) < Math.abs(dy) * 1.6) return 0;
  return dx < 0 ? 1 : -1; // swipe left → next
}
