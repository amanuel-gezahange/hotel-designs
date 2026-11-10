/**
 * Looks at the real finished website in a real browser and checks it, for all 15 styles:
 *   1. TEXT:    is the banner text readable against the photo behind it?
 *   2. SCREENS: no sideways scrolling, nothing sticking out, big enough tap targets, no tiny text
 *   3. MOTION:  do the animations work, and do "animations off" / "reduce motion" switch them off?
 *
 *   npm run browser-audit -- demo-lodge            (full: about 10 minutes)
 *   npm run browser-audit -- demo-lodge --quick    (fewer screen sizes: about 4 minutes)
 *
 * Needs Google Chrome installed (or set CHROME_PATH). Builds the style showcase first if needed.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import os from "node:os";
import sharp from "sharp";

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const quick = args.includes("--quick");
if (!slug) {
  console.error("Usage: npm run browser-audit -- <client-name> [--quick]");
  process.exit(1);
}

/* ---------- find Chrome ---------- */
const CHROME = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  path.join(os.homedir(), "Desktop/Google Chrome.app/Contents/MacOS/Google Chrome"),
  path.join(os.homedir(), "Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((p) => p && fs.existsSync(p));
if (!CHROME) {
  console.error("Could not find Google Chrome. Install it, or set CHROME_PATH=/path/to/chrome");
  process.exit(1);
}

/* ---------- make sure the showcase is built, then serve it ---------- */
const dir = path.resolve("dist", `${slug}-themes`);
if (!fs.existsSync(dir)) {
  console.log("Building the style showcase first…");
  const b = spawnSync("npx", ["tsx", "scripts/build-site.ts", slug, "--themes"], { stdio: "inherit" });
  if (b.status !== 0) process.exit(b.status ?? 1);
}
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".txt": "text/plain", ".xml": "application/xml", ".json": "application/json", ".ico": "image/x-icon" };
const server = http.createServer((req, res) => {
  let p = path.join(dir, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!p.startsWith(dir)) return res.writeHead(403).end();
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
  if (!fs.existsSync(p)) { p = path.join(dir, "404.html"); res.statusCode = 404; }
  res.setHeader("content-type", types[path.extname(p)] ?? "application/octet-stream");
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://localhost:${server.address().port}`;

/* ---------- tiny Chrome remote-control helper ---------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const debugPort = 9700 + Math.floor(Math.random() * 200);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "stay-audit-"));
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
let targets;
for (let i = 0; i < 60 && !targets; i++) { try { targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json(); } catch { await sleep(250); } }
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let nextId = 0;
const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); pending.get(d.id)?.(d); pending.delete(d.id); };
const send = (method, params = {}) => new Promise((res) => { const id = ++nextId; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true })).result?.result?.value;
await send("Page.enable");
const view = (w, h, mobile) => send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
const open = async (lang, style, wait = 2200) => { await send("Page.navigate", { url: `${BASE}/${lang}/?theme=${style}` }); await sleep(wait); };
const scrollThrough = async (h) => {
  const total = await ev("document.documentElement.scrollHeight");
  for (let y = 0; y < total; y += h * 0.7) { await ev(`window.scrollTo({top:${y},behavior:'instant'})`); await sleep(90); }
  await sleep(500);
  await ev("window.scrollTo({top:0,behavior:'instant'})");
  await sleep(300);
};

const ONLY = args.find((a) => a.startsWith("--only="))?.split("=")[1]?.split(",");
const ALL_STYLES = ["classic", "modern", "resort", "heritage", "luxe", "editorial", "immersive", "vibrant", "zen", "safari", "moodboard", "scrapbook", "aurora", "academia", "retro"];
const STYLES = ONLY ?? ALL_STYLES;
const PHOTO_TEXT_STYLES = ["classic", "modern", "resort", "heritage", "luxe", "immersive", "vibrant", "moodboard", "aurora", "academia"].filter((x) => !ONLY || ONLY.includes(x)); // white text over the photo
let failures = 0;
const fail = (m) => { failures++; console.log("  ✗ " + m); };
const pass = (m) => console.log("  ✓ " + m);

/* ================= 1. TEXT OVER PHOTO ================= */
console.log("\n1. TEXT: is the banner text readable over the photo?");
{
  const lin = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  let checked = 0, low = 0;
  for (const [label, w, h, mobile] of [["desktop", 1300, 820, false], ["phone", 390, 844, true]]) {
    await view(w, h, mobile);
    for (const st of PHOTO_TEXT_STYLES) {
      await open("en", st, 2600);
      await ev("window.scrollTo(0,0)");
      await sleep(2300);
      const blocks = JSON.parse(await ev(`JSON.stringify([...document.querySelectorAll('.hero-inner > *')].filter(e => e.textContent.trim() && !e.querySelector('a') && getComputedStyle(e).backgroundColor === 'rgba(0, 0, 0, 0)').map(e => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); return { tag: e.tagName, x: r.left, y: r.top, w: r.width, h: r.height, color: c.color, size: parseFloat(c.fontSize) } }))`));
      await ev(`document.querySelectorAll('.hero-inner > *, header, [aria-live]').forEach(e => e.style.visibility='hidden')`);
      await sleep(300);
      const png = Buffer.from((await send("Page.captureScreenshot", { format: "png" })).result.data, "base64");
      for (const el of blocks) {
        const nums = el.color.match(/[\d.]+(?:e-?\d+)?/g).map(Number);
        let tl, alpha = 1;
        if (el.color.startsWith("oklab(")) { tl = nums[0] ** 3; alpha = el.color.includes("/") ? nums[3] : 1; }
        else if (el.color.startsWith("color(")) { tl = lum(nums[0] * 255, nums[1] * 255, nums[2] * 255); alpha = el.color.includes("/") ? nums[3] : 1; }
        else { tl = lum(nums[0], nums[1], nums[2]); alpha = nums.length > 3 ? nums[3] : 1; }
        const left = Math.max(0, Math.round(el.x)), top = Math.max(0, Math.round(el.y));
        const width = Math.min(Math.round(el.w), w - left), height = Math.min(Math.round(el.h), h - top);
        if (width < 5 || height < 5) continue;
        const { data, info } = await sharp(png).extract({ left, top, width, height }).raw().toBuffer({ resolveWithObject: true });
        const ls = [];
        for (let p = 0; p < data.length; p += info.channels) ls.push(lum(data[p], data[p + 1], data[p + 2]));
        ls.sort((a, b) => a - b);
        const bg = tl > 0.5 ? ls[Math.floor(ls.length * 0.75)] : ls[Math.floor(ls.length * 0.25)]; // brighter quarter behind light text
        const eff = alpha * tl + (1 - alpha) * bg;
        const ratio = (Math.max(eff, bg) + 0.05) / (Math.min(eff, bg) + 0.05);
        const need = el.size >= 24 ? 3 : 4.5;
        checked++;
        if (ratio < need) { low++; fail(`${label} ${st} <${el.tag}> ${Math.round(el.size)}px: contrast ${ratio.toFixed(2)}:1, needs ${need}`); }
      }
    }
  }
  if (!low) pass(`all ${checked} text blocks are readable (desktop and phone, ${PHOTO_TEXT_STYLES.length} photo styles)`);
}

/* ================= 2. SCREEN SIZES ================= */
console.log("\n2. SCREENS: sideways scroll, tap targets, tiny text");
{
  const views = quick
    ? [["phone 360", 360, 740, true], ["tablet 768", 768, 1024, true], ["desktop 1440", 1440, 900, false]]
    : [["phone 360", 360, 740, true], ["phone 390", 390, 844, true], ["tablet 768", 768, 1024, true], ["laptop 1024", 1024, 768, false], ["desktop 1440", 1440, 900, false], ["monitor 1920", 1920, 1080, false]];
  const probe = `(() => {
    const vw = document.documentElement.clientWidth;
    const out = { overflowPx: document.documentElement.scrollWidth - vw, offscreen: [], small: [], tiny: [] };
    const scroller = (el) => el.closest('.rooms-grid, .photo-grid, .amenities-wrap, [role=dialog], [data-no-swipe], iframe');
    const name = (el) => el.tagName.toLowerCase() + ' "' + (el.textContent || '').trim().slice(0, 18) + '"';
    for (const el of document.querySelectorAll('main *, header *, footer *')) {
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
      const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || cs.position === 'fixed') continue;
      if (!scroller(el) && (r.right > vw + 1 || r.left < -1) && !el.closest('.hero-bg, .hero-overlay')) out.offscreen.push(name(el));
      if (['A','BUTTON','SELECT','INPUT','SUMMARY'].includes(el.tagName) && !scroller(el) && !el.closest('p, dd, li, summary, label') && r.height < 36 && el.type !== 'hidden' && !el.classList.contains('hidden')) out.small.push(name(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (own && parseFloat(cs.fontSize) < 11.5 && !scroller(el)) out.tiny.push(name(el) + ' ' + cs.fontSize);
    }
    return JSON.stringify(out);
  })()`;
  let combos = 0, bad = 0;
  for (const lang of ["en", "am"]) {
    for (const [label, w, h, mobile] of views) {
      await view(w, h, mobile);
      for (const st of STYLES) {
        const t0 = Date.now();
        await open(lang, st, 1700);
        const t1 = Date.now();
        await scrollThrough(h);
        const t2 = Date.now();
        const r = JSON.parse(await ev(probe));
        combos++;
        if (process.env.AUDIT_VERBOSE) console.log(`    ${lang} ${label} ${st}: load ${t1 - t0}ms, scroll ${t2 - t1}ms, probe ${Date.now() - t2}ms`);
        const problems = [];
        if (r.overflowPx > 1) problems.push(`sideways scroll ${r.overflowPx}px`);
        if (r.offscreen.length) problems.push(`sticks out: ${[...new Set(r.offscreen)].slice(0, 2).join("; ")}`);
        if (r.small.length) problems.push(`small tap target: ${[...new Set(r.small)].slice(0, 2).join("; ")}`);
        if (r.tiny.length) problems.push(`tiny text: ${[...new Set(r.tiny)].slice(0, 2).join("; ")}`);
        if (problems.length) { bad++; fail(`${lang} ${label} ${st}: ${problems.join(" | ")}`); }
      }
    }
  }
  if (!bad) pass(`${combos} combinations clean (${STYLES.length} styles x ${views.length} sizes x English/Amharic)`);
}

/* ================= 3. MOTION ================= */
console.log("\n3. MOTION: animations work, and switch off when asked");
{
  await view(1300, 820, false);
  const check = (label, cond, extra = "") => (cond ? pass(label) : fail(`${label} ${extra}`));
  for (const [st, want] of [["classic", "heroRise"], ["luxe", "luxTitle"], ["editorial", "heroWipe"], ["retro", "heroPop"]]) {
    await open("en", st);
    const a = await ev(`getComputedStyle(document.querySelector('.hero-inner > h1')).animationName`);
    check(`banner entrance in ${st} (${want})`, a === want, `got ${a}`);
  }
  await open("en", "modern");
  const prog = async () => ev("parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--progress'))");
  const p0 = await prog();
  await ev("window.scrollTo({top: document.documentElement.scrollHeight/2, behavior:'instant'})"); await sleep(500);
  const p1 = await prog();
  await ev("window.scrollTo({top: 1e6, behavior:'instant'})"); await sleep(500);
  const p2 = await prog();
  check("progress line follows the scroll", p0 < 0.05 && p1 > 0.3 && p1 < 0.7 && p2 > 0.95, `${p0} ${p1} ${p2}`);
  await open("en", "immersive");
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1200, y: 100 }); await sleep(400);
  check("Cinematic photo follows the mouse", (await ev("parseFloat(document.documentElement.style.getPropertyValue('--mx'))")) > 0.7);
  await open("en", "aurora");
  await ev("document.querySelector('#rooms').scrollIntoView({behavior:'instant'})"); await sleep(1800);
  const pos = JSON.parse(await ev("(() => { const r = document.querySelector('.room-card').getBoundingClientRect(); return JSON.stringify({x: r.left + 120, y: r.top + 90}) })()"));
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: pos.x, y: pos.y }); await sleep(500);
  check("card glow follows the cursor", /px$/.test(await ev("document.querySelector('.room-card').style.getPropertyValue('--px')")));
  for (const [st, want] of [["vibrant", true], ["retro", true], ["immersive", true], ["classic", false]]) {
    await open("en", st);
    const j = JSON.parse(await ev(`JSON.stringify({ anim: getComputedStyle(document.querySelector('.amenities-grid')).animationName, dup: getComputedStyle(document.querySelector('.amenity-dup')).display })`));
    check(`amenities ticker ${want ? "runs" : "stays off"} in ${st}`, want ? j.anim === "marquee" && j.dup !== "none" : j.anim === "none" && j.dup === "none", JSON.stringify(j));
  }
  await open("en", "vibrant");
  await ev("document.documentElement.dataset.motion = 'off'"); await sleep(400);
  const off = JSON.parse(await ev(`JSON.stringify({ hero: getComputedStyle(document.querySelector('.hero-inner > h1')).animationName, ticker: getComputedStyle(document.querySelector('.amenities-grid')).animationName, bar: getComputedStyle(document.documentElement, '::after').display, grid: getComputedStyle(document.querySelector('.amenities-grid')).display })`));
  check("'animations off' stops everything and restores the still grid", off.hero === "none" && off.ticker === "none" && off.bar === "none" && off.grid === "grid", JSON.stringify(off));
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await open("en", "immersive");
  const rm = JSON.parse(await ev(`JSON.stringify({ hero: getComputedStyle(document.querySelector('.hero-inner > h1')).animationName, ticker: getComputedStyle(document.querySelector('.amenities-grid')).animationName, hidden: document.querySelectorAll('[data-reveal]:not(.in)').length })`));
  check("'reduce motion' is respected", rm.hero === "none" && rm.ticker === "none" && rm.hidden === 0, JSON.stringify(rm));
}

console.log(failures ? `\n${failures} problem(s) found.` : "\nAll browser checks passed.");
ws.close();
chrome.kill();
server.close();
fs.rmSync(profile, { recursive: true, force: true });
process.exit(failures ? 1 : 0);
