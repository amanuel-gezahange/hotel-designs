# Stay Kit: technical notes (for developers)

The simple, friendly guide is in README.md. This file keeps the deeper technical details.


You give it a client's details and photos. It produces a finished, standalone website
(plain files, no server, no database) that you upload to any hosting.

```
  new-site            fill in             build-site              upload
  ─────────►  site.json + photos  ─────────────►  dist/<client>/  ─────────►  client's hosting
  (1 command)       (the real work)         (1 command)        + .zip           & domain
```

## Daily workflow

```bash
# 1. Start a client, choosing a look: classic (warm) · modern (bold, bright) · resort (airy, centered)
npm run new-site -- beta-lodge "Beta Lodge" --style=modern

# 2. Fill in  sites/beta-lodge/site.json   (name, phone, WhatsApp, rooms, prices, colors)
#    Drop photos in  sites/beta-lodge/images/  named like:
#       hero.jpg   about.jpg   logo.png   gallery-1.jpg gallery-2.jpg …
#       room-standard.jpg (main)  room-standard-2.jpg  room-standard-3.jpg …  (extra photos for that room's page)

# 3. Build it (also warns about forgotten placeholders)
npm run build-site -- beta-lodge

# 4. Look at it
npm run preview -- beta-lodge          # http://localhost:4000

# 5. Deliver: upload everything inside dist/beta-lodge/  (or send dist/beta-lodge.zip)
```

Need a change later? Edit that client's `site.json` or photos, run `build-site` again, upload again.

## Prefer clicking over editing a file? Use the visual editor

```bash
npm run dev                     # then open http://localhost:3000/admin (first visit creates your login)
# Clients → + New client → Edit: fill in forms, upload photos, pick a style
# ⋯ menu → Download website (zip): same as `npm run make -- beta-lodge`
```

## What every site includes

- Its own page for every room: photo gallery with fullscreen viewer, details, price, booking form
- Three visual styles to choose from per client

- English + Amharic, mobile-first, fast (photos auto-shrunk to WebP)
- Rooms with prices (ETB/USD), about, amenities, gallery, reviews, FAQ, map, contact
- Booking form that opens WhatsApp with the guest's details pre-filled
- SEO basics: titles, hotel structured data, sitemap, robots.txt
- Per-client colors, corner style, heading style, which sections show and in what order

## Where to host the output

Any static hosting works, including cheap cPanel hosting: upload the files into `public_html`.
Free options: Cloudflare Pages, Netlify, GitHub Pages. Point the client's domain at it.

## Changing the design for ALL future clients

Edit the shared code once, rebuild any client:
- `src/components/sections/` the sections (rooms, gallery, …)
- `src/components/Hero.tsx`, `Nav.tsx`, `Footer.tsx`, `SiteShell.tsx`
- `sites/_template/site.json` the starting content for new clients

## Optional: hosted mode (not needed for the factory)

The project also contains a hosted multi-client mode (`npm run dev` → `/admin`): clients log in to edit
their own site and see booking inquiries, all served from one server. Use it later if you want to sell
monthly "we host and you edit it yourself" plans. See `.env.local.example`. The factory ignores it entirely.

## Before you change the shared design

```bash
npm run check          # type-check + lint + input-safety audit (hostile-input tests). Must end with "0 failed"
```

## Troubleshooting

**`npm run dev` keeps recompiling ("Compiled in 0ms" over and over, page keeps reloading)**
Stop it with Ctrl+C, then: `rm -rf .next && npm run dev`. If it persists, try a fresh Incognito window (an extension or stale tab can keep reloading the page).

`npm run build-site` and `npm run make` are safe to run while dev is open: they build in a private
copy (`.factory-work`, deleted afterwards). Plain `npm run build` (hosted mode, for deployment) is not:
stop dev first.

## Security notes (hosted mode)

- Logins are limited to 8 attempts per 10 minutes per email+address; booking requests to 6 per 10 minutes.
  These limits are in memory (per server): add a shared store if you run several servers.
- Every piece of text that enters the system is validated (see `src/lib/validate.ts`, `src/lib/inquiry.ts`):
  the editor/site.json (strict schema: types, lengths, https-only links, hex colors, unique room addresses),
  booking requests (names, phones, real dates, guest counts; invisible/direction-override characters removed),
  client names and domains, uploaded photos (real photo formats only; SVG/PDF refused; size and pixel limits),
  and all command-line names. Text is always shown as plain text (never as HTML).
- `npm run audit` re-runs those hostile-input tests: run it after changing a validator.
- Set a strong `AUTH_SECRET` in production, and use a strong operator password. The first-run “create your admin account” screen only appears outside production.
