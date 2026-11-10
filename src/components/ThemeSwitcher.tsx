"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { STYLE_NAMES, STYLE_ORDER, STYLE_PRESETS, swipeDir, themeVars } from "@/lib/presets";
import type { Style } from "@/lib/types";

/**
 * Preview bar for comparing the 5 looks on the hotel's real content, live (no reload).
 * Swipe left/right, press ← →, tap the dots, or use the arrows.
 *   mode "always": always shown (the "showcase" build you send to a client)
 *   mode "query":  only when the address ends with ?themes (handy while editing)
 */
export function ThemeSwitcher({
  initial,
  mode,
  labels,
}: {
  initial: Style;
  mode: "always" | "query";
  labels: { theme: string; hint: string; prev: string; next: string; show: string; hide: string; tourStart: string; tourStop: string };
}) {
  const [current, setCurrent] = useState<Style>(initial);
  const [enabled, setEnabled] = useState(mode === "always");
  const [open, setOpen] = useState(true);
  const [tour, setTour] = useState(false);
  const currentRef = useRef<Style>(initial);

  const apply = useCallback((style: Style) => {
    const root = document.documentElement;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!calm) {
      root.classList.add("theme-anim");
      window.setTimeout(() => root.classList.remove("theme-anim"), 700);
    }
    root.dataset.style = style;
    root.dataset.heading = STYLE_PRESETS[style].headingFont;
    root.classList.remove("vibe-switch");
    void root.offsetWidth; // restart the fade-in animation
    root.classList.add("vibe-switch");
    window.scrollTo({ top: Math.min(window.scrollY, 0) });
    for (const [k, v] of Object.entries(themeVars(STYLE_PRESETS[style]))) root.style.setProperty(k, v);
    currentRef.current = style;
    setCurrent(style);
    const url = new URL(window.location.href);
    url.searchParams.set("theme", style);
    window.history.replaceState(null, "", url);
  }, []);

  const go = useCallback(
    (d: 1 | -1) => {
      const i = STYLE_ORDER.indexOf(currentRef.current);
      apply(STYLE_ORDER[(i + d + STYLE_ORDER.length) % STYLE_ORDER.length]);
    },
    [apply],
  );
  // Auto tour: move to the next style every few seconds, scrolling back to the top so the banner is seen
  useEffect(() => {
    if (!tour) return;
    const id = window.setInterval(() => go(1), 5000);
    return () => window.clearInterval(id);
  }, [tour, go]);

  // Read the address once: ?themes turns the bar on, ?theme=luxe starts on that look
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const wanted = q.get("theme") as Style | null;
    if (mode === "query" && !q.has("themes") && !wanted) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading the URL is only possible after the page loads
    setEnabled(true);
    if (wanted && STYLE_ORDER.includes(wanted) && wanted !== currentRef.current) apply(wanted);
  }, [mode, apply]);

  // Swipe (touch) and keyboard
  useEffect(() => {
    if (!enabled) return;
    let start: { x: number; y: number; t: number } | null = null;
    const blocked = (el: EventTarget | null) =>
      el instanceof Element && !!el.closest("input, textarea, select, iframe, [role=dialog], [data-no-swipe]");

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      start = t && !blocked(e.target) ? { x: t.clientX, y: t.clientY, t: Date.now() } : null;
    };
    const onEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (!start || !t) return;
      const dir = swipeDir(t.clientX - start.x, t.clientY - start.y, Date.now() - start.t);
      start = null;
      if (dir) {
        setTour(false);
        go(dir);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (blocked(e.target) || document.querySelector("[role=dialog]")) return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") setTour(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [enabled, go]);

  if (!enabled) return null;

  const index = STYLE_ORDER.indexOf(current);
  const round = "grid h-9 w-9 place-items-center rounded-full bg-white/15 text-xl leading-none hover:bg-white/30";

  if (!open) {
    return (
      <button
        type="button"
        data-no-swipe
        onClick={() => setOpen(true)}
        className="fixed bottom-3 left-3 z-50 rounded-full bg-black/80 px-4 py-2 text-sm font-semibold text-white shadow-xl backdrop-blur"
      >
        🎨 {labels.show}
      </button>
    );
  }

  return (
    <div data-no-swipe className="fixed bottom-3 left-3 z-50 sm:left-1/2 sm:-translate-x-1/2">
      <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-black/80 px-3 py-2 text-white shadow-2xl backdrop-blur">
        <p className="text-sm font-semibold" aria-live="polite">
          {labels.theme} {index + 1}/{STYLE_ORDER.length}: {STYLE_NAMES[current]}
        </p>
        <div className="flex items-center gap-2">
          <button type="button" aria-label={labels.prev} className={round} onClick={() => { setTour(false); go(-1); }}>‹</button>
          <div className="hidden gap-1 sm:flex">
            {STYLE_ORDER.map((s) => {
              const p = STYLE_PRESETS[s];
              return (
                <button
                  key={s}
                  type="button"
                  aria-label={STYLE_NAMES[s]}
                  aria-pressed={s === current}
                  title={STYLE_NAMES[s]}
                  onClick={() => { setTour(false); apply(s); }}
                  style={{ background: `linear-gradient(135deg, ${p.brand} 50%, ${p.accent} 50%)` }}
                  className={`h-5 w-5 rounded-full border-2 transition ${s === current ? "scale-125 border-white" : "border-white/30"}`}
                />
              );
            })}
          </div>
          <button type="button" aria-label={labels.next} className={round} onClick={() => { setTour(false); go(1); }}>›</button>
          <button
            type="button"
            aria-pressed={tour}
            aria-label={tour ? labels.tourStop : labels.tourStart}
            title={tour ? labels.tourStop : labels.tourStart}
            className={`${round} text-sm ${tour ? "bg-white text-black hover:bg-white" : ""}`}
            onClick={() => setTour((v) => !v)}
          >
            {tour ? "❚❚" : "▶"}
          </button>
          <button type="button" aria-label={labels.hide} className="ml-1 text-sm text-white/70 hover:text-white" onClick={() => setOpen(false)}>✕</button>
        </div>
        <p className="text-[11px] text-white/70">{labels.hint}</p>
      </div>
    </div>
  );
}
