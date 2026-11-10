"use client";

import { useEffect } from "react";

/**
 * Brings the page to life (no visible UI of its own):
 *  - elements marked data-reveal fade/slide in as they scroll into view (look depends on the style)
 *  - numbers marked data-count count up when they appear
 *  - sets --scroll-y for the hero parallax, and an "scrolled" class for see-through headers
 * Everything respects "reduce motion" and the site's animations on/off setting.
 */
export function MotionEngine() {
  useEffect(() => {
    const root = document.documentElement;

    /* scroll position → header style + parallax */
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        root.classList.toggle("scrolled", y > 30);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        root.style.setProperty("--progress", max > 0 ? String(Math.min(y / max, 1).toFixed(4)) : "0");
        if (y < window.innerHeight * 1.6) root.style.setProperty("--scroll-y", String(Math.round(y)));
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* pointer effects: only for real mouse/trackpad users, never on touch screens */
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let moving = false;
    let lastEvt: PointerEvent | null = null;
    const onMove = (e: PointerEvent) => {
      lastEvt = e;
      if (moving) return;
      moving = true;
      requestAnimationFrame(() => {
        moving = false;
        const ev = lastEvt;
        if (!ev || root.dataset.motion === "off") return;
        // gentle mouse parallax for the hero photo (-1 .. 1 from the screen centre)
        root.style.setProperty("--mx", ((ev.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        root.style.setProperty("--my", ((ev.clientY / window.innerHeight) * 2 - 1).toFixed(3));
        // a soft glow that follows the cursor across a card
        const card = (ev.target as Element | null)?.closest?.(".card") as HTMLElement | null;
        if (card) {
          const r = card.getBoundingClientRect();
          card.style.setProperty("--px", `${Math.round(ev.clientX - r.left)}px`);
          card.style.setProperty("--py", `${Math.round(ev.clientY - r.top)}px`);
        }
      });
    };
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });

    /* reveal on scroll */
    const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || root.dataset.motion === "off";

    const countUp = (el: HTMLElement) => {
      const target = el.matches("[data-count]") ? [el] : [...el.querySelectorAll<HTMLElement>("[data-count]")];
      for (const n of target) {
        const m = /^(\d+(?:\.\d+)?)(.*)$/.exec(n.textContent?.trim() ?? "");
        if (!m || n.dataset.counted) continue;
        n.dataset.counted = "1";
        const end = parseFloat(m[1]);
        const decimals = m[1].includes(".") ? m[1].split(".")[1].length : 0;
        const t0 = performance.now();
        const dur = 1400;
        const tick = (now: number) => {
          const p = Math.min((now - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          n.textContent = (end * eased).toFixed(decimals) + m[2];
          if (p < 1) requestAnimationFrame(tick);
        };
        n.textContent = (0).toFixed(decimals) + m[2];
        requestAnimationFrame(tick);
      }
    };

    const show = (el: HTMLElement) => {
      el.classList.add("in");
      if (!calm()) countUp(el);
      // once it has finished appearing, let normal hover effects take over
      window.setTimeout(() => el.removeAttribute("data-reveal"), 2200);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          show(e.target as HTMLElement);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => (calm() ? show(el) : io.observe(el)));

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      io.disconnect();
    };
  }, []);

  return null;
}
