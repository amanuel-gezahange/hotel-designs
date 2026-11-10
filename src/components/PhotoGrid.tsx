"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Photo gallery with a fullscreen viewer (click a photo; ← → keys or buttons; Esc closes).
 * variant "grid": masonry-style grid for the home page. "room": one big photo + thumbnails.
 */
export function PhotoGrid({
  images,
  alt,
  variant = "grid",
  labels,
}: {
  images: string[];
  alt: string;
  variant?: "grid" | "room";
  labels: { close: string; next: string; prev: string };
}) {
  const [open, setOpen] = useState<number | null>(null);
  const n = images.length;
  const go = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + n) % n)), [n]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, go]);

  const btn = (i: number, cls: string) => (
    <button
      key={images[i]}
      type="button"
      data-reveal
      style={{ "--i": Math.min(i, 8) } as React.CSSProperties}
      onClick={() => setOpen(i)}
      className={`photo-item block overflow-hidden ${cls}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[i]}
        alt={`${alt} ${i + 1}`}
        loading={i === 0 ? "eager" : "lazy"}
        className="h-full w-full object-cover transition duration-500 hover:scale-105"
      />
    </button>
  );

  return (
    <>
      {variant === "room" ? (
        <div className="space-y-3">
          {btn(0, "aspect-[16/10] w-full rounded-[var(--radius)]")}
          {n > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.slice(1).map((_, k) => btn(k + 1, "aspect-[4/3] rounded-[var(--radius)]"))}
            </div>
          )}
        </div>
      ) : (
        <div className="photo-grid grid grid-cols-2 gap-3 md:grid-cols-3">
          {images.map((_, i) => btn(i, i % 5 === 0 ? "row-span-2 min-h-64 rounded-[var(--radius)]" : "aspect-square rounded-[var(--radius)]"))}
        </div>
      )}

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4"
          onClick={() => setOpen(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[open]}
            alt={`${alt} ${open + 1}`}
            className="max-h-[88vh] max-w-full rounded object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button type="button" aria-label={labels.close} className="absolute right-4 top-4 h-11 w-11 rounded-full bg-white/15 text-2xl text-white hover:bg-white/30" onClick={() => setOpen(null)}>
            ✕
          </button>
          {n > 1 && (
            <>
              <button type="button" aria-label={labels.prev} className="absolute left-3 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full bg-white/15 text-2xl text-white hover:bg-white/30" onClick={(e) => { e.stopPropagation(); go(-1); }}>
                ‹
              </button>
              <button type="button" aria-label={labels.next} className="absolute right-3 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full bg-white/15 text-2xl text-white hover:bg-white/30" onClick={(e) => { e.stopPropagation(); go(1); }}>
                ›
              </button>
              <p className="absolute bottom-4 text-sm text-white/80">
                {open + 1} / {n}
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}
