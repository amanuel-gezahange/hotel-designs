/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-expressions */
/**
 * Input-safety regression test:   npm run audit
 * Throws hostile values at the site-file, booking-request and name/domain validators.
 * Run it after changing anything in src/lib/validate.ts or src/lib/inquiry.ts.
 */
import fs from "node:fs";
import { parseSiteConfig, normalizeDomain, SLUG, isReservedSlug } from "../src/lib/validate";
import { cleanInquiry, oneLine } from "../src/lib/inquiry";
import { STYLE_ORDER, STYLE_PRESETS, contrast, mixHex, readableOn, readableText, swipeDir, themeVars } from "../src/lib/presets";

let pass = 0, fail = 0;
const ok = (label: string, cond: boolean, extra = "") => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? "  → " + extra : ""}`); };

/* ---------- A. site config ---------- */
console.log("\n=== A. site config (what the editor saves / factory builds) ===");
for (const f of ["sites/abay-lodge/site.json", "sites/_template/site.json", "sites/demo-lodge/site.json"]) {
  try { parseSiteConfig(JSON.parse(fs.readFileSync(f, "utf8"))); ok(`real file accepted: ${f}`, true); } catch (e) { ok(`real file accepted: ${f}`, false, (e as Error).message); }
}
const base = JSON.parse(fs.readFileSync("sites/abay-lodge/site.json", "utf8"));
const reject = (label: string, mut: (c: any) => void) => {
  const c = structuredClone(base); mut(c);
  try { parseSiteConfig(c); ok(`rejects ${label}`, false, "ACCEPTED!"); } catch (e) { ok(`rejects ${label}`, true, (e as Error).message.slice(0, 90)); }
};
reject("name as an object (would crash the page)", (c) => (c.name = { x: 1 }));
reject("empty name", (c) => (c.name = "   "));
reject("name 5,000 chars", (c) => (c.name = "x".repeat(5000)));
reject("price as text", (c) => (c.rooms[0].priceFrom = "abc"));
reject("negative price", (c) => (c.rooms[0].priceFrom = -5));
reject("capacity 0", (c) => (c.rooms[0].capacity = 0));
reject("room id '../admin'", (c) => (c.rooms[0].id = "../admin"));
reject("room id uppercase", (c) => (c.rooms[0].id = "Deluxe"));
reject("duplicate room ids", (c) => (c.rooms[1].id = c.rooms[0].id));
reject("javascript: in facebook link", (c) => (c.social.facebook = "javascript:alert(1)"));
reject("data: URL as hero photo", (c) => (c.hero.image = "data:text/html,<script>alert(1)</script>"));
reject("javascript: as hero photo", (c) => (c.hero.image = "javascript:alert(1)"));
reject("protocol-relative photo //evil.com/x.jpg", (c) => (c.hero.image = "//evil.com/x.jpg"));
reject("photo path with spaces/quotes", (c) => (c.hero.image = '/images/a" onerror="alert(1).jpg'));
reject("map embed http://", (c) => (c.contact.mapEmbedUrl = "http://x.com"));
reject("map embed javascript:", (c) => (c.contact.mapEmbedUrl = "javascript:alert(1)"));
reject("mapsUrl with quote injection", (c) => (c.contact.mapsUrl = 'https://x.com" onclick="alert(1)'));
reject("color CSS injection", (c) => (c.theme.brand = "red;}body{display:none"));
reject("color 'red'", (c) => (c.theme.accent = "red"));
reject("unknown style", (c) => (c.theme.style = "hacker"));
reject("unknown language", (c) => (c.languages = ["en", "fr"]));
reject("no languages", (c) => (c.languages = []));
reject("whatsapp with plus/spaces", (c) => (c.contact.whatsapp = "+251 911 000"));
reject("whatsapp too short", (c) => (c.contact.whatsapp = "12345"));
reject("phone with letters", (c) => (c.contact.phone = "call me"));
reject("phone with tel: injection", (c) => (c.contact.phone = "123;javascript:x"));
reject("bad email", (c) => (c.contact.email = "not-an-email"));
reject("gallery as a string", (c) => (c.gallery = "oops"));
reject("101 gallery photos", (c) => (c.gallery = Array(101).fill("/images/a.webp")));
reject("rating 9", (c) => (c.testimonials[0].rating = 9));
reject("sections as a string", (c) => (c.sections = "about"));
reject("unknown section", (c) => (c.sections = ["about", "admin"]));
reject("rooms is null", (c) => (c.rooms = null));
reject("500KB payload", (c) => (c.about.body = [{ en: "x".repeat(3000) }, ...Array(19).fill("y".repeat(3000))].concat(Array(60).fill("z".repeat(3999)))));
{
  const c = structuredClone(base); c.__proto__ = { polluted: 1 }; (c as any).evil = "x"; c.rooms[0].extra = "y";
  const out: any = parseSiteConfig(c);
  ok("drops unknown fields", out.evil === undefined && out.rooms[0].extra === undefined);
  const c2 = JSON.parse('{"__proto__":{"admin":true}}'); try { parseSiteConfig(c2); } catch {}
  ok("prototype pollution has no effect", ({} as any).admin === undefined);
}
{ const c = structuredClone(base); c.contact.phone = "+251 911-00 00 00"; c.languages = ["am"]; c.defaultLang = "en";
  const o = parseSiteConfig(c); ok("repairs default language", o.defaultLang === "am"); }
{ const c = structuredClone(base); c.sections = ["rooms", "rooms"]; const o = parseSiteConfig(c); ok("dedupes sections & adds contact", o.sections.join() === "rooms,contact"); }
{ const c = structuredClone(base); c.name = '<img src=x onerror=alert(1)> "quoted" & Ünï'; const o = parseSiteConfig(c);
  ok("keeps odd text as plain text (escaped at display time)", o.name.includes("<img")); }
{ const c = structuredClone(base); c.name = "ሰላም ሆቴል · አዲስ አበባ"; ok("accepts Amharic text", parseSiteConfig(c).name === "ሰላም ሆቴል · አዲስ አበባ"); }

/* ---------- B. booking requests ---------- */
console.log("\n=== B. booking requests from the public form ===");
const good = { name: "Abel T.", phone: "+251 911 22 33 44", checkIn: "2026-12-01", checkOut: "2026-12-03", guests: 2, room: "Deluxe" };
ok("normal request accepted", cleanInquiry(good) !== null);
ok("Amharic name accepted", cleanInquiry({ ...good, name: "አበበ በቀለ" })?.name === "አበበ በቀለ");
ok("rejects empty name", cleanInquiry({ ...good, name: "   " }) === null);
ok("rejects name of only invisible chars", cleanInquiry({ ...good, name: "​\u202E\u0000" }) === null);
ok("rejects phone with letters", cleanInquiry({ ...good, phone: "abc" }) === null);
ok("rejects phone injection", cleanInquiry({ ...good, phone: "1;DROP TABLE" }) === null);
ok("rejects impossible date 2026-02-31", cleanInquiry({ ...good, checkIn: "2026-02-31" }) === null);
ok("rejects date text", cleanInquiry({ ...good, checkIn: "tomorrow" }) === null);
ok("rejects check-out before check-in", cleanInquiry({ ...good, checkIn: "2026-12-05", checkOut: "2026-12-01" }) === null);
ok("guests 9999 capped to 50", cleanInquiry({ ...good, guests: 9999 })?.guests === 50);
ok("guests 'abc' → 1", cleanInquiry({ ...good, guests: "abc" })?.guests === 1);
ok("guests -4 → 1", cleanInquiry({ ...good, guests: -4 })?.guests === 1);
ok("name 10,000 chars cut to 100", cleanInquiry({ ...good, name: "a".repeat(10000) })?.name.length === 100);
ok("strips control + bidi-override chars", oneLine("Ab\u202Ecd\u0000e\nf​g", 50) === "Ab cd e f g");
ok("collapses whitespace", oneLine("a    b\t\tc", 50) === "a b c");
ok("non-string values don't crash", cleanInquiry({ name: { a: 1 }, phone: [], guests: {} }) !== undefined);
ok("HTML kept as harmless text", cleanInquiry({ ...good, name: "<script>alert(1)</script>" })?.name === "<script>alert(1)</script>");

/* ---------- C. names & domains ---------- */
console.log("\n=== C. client names (slugs) and domains ===");
for (const s of ["beta-lodge", "ab", "a1-b2"]) ok(`slug accepted: ${s}`, SLUG.test(s));
for (const s of ["a", "-ab", "ab-", "Ab", "a_b", "a b", "../x", "a/b", "a".repeat(41), "", "a.b", "ab\n"]) ok(`slug rejected: ${JSON.stringify(s)}`, !SLUG.test(s));
for (const s of ["www", "admin", "api", "uploads", "s"]) ok(`reserved slug: ${s}`, isReservedSlug(s));
const dom: [string, string | null][] = [["https://www.AbayLodge.com/path?x=1", "abaylodge.com"], ["abaylodge.com", "abaylodge.com"], ["bad domain", null], ["localhost", null], ["a..b.com", null], ["-a.com", null], ["a.com/../x", "a.com"], ["javascript:alert(1)", null], ["", null], ["a".repeat(300) + ".com", null], ["xn--abc.et", "xn--abc.et"]];
for (const [i, e] of dom) ok(`domain ${JSON.stringify(i.slice(0, 40))} → ${e}`, normalizeDomain(i) === e);

/* ---------- D. themes & swipe ---------- */
console.log("\n=== D. the 15 themes and the swipe rule ===");
ok("exactly 15 themes", STYLE_ORDER.length === 15 && Object.keys(STYLE_PRESETS).length === 15 && new Set(STYLE_ORDER).size === 15);
for (const st of STYLE_ORDER) {
  const c = structuredClone(base); c.theme = { ...STYLE_PRESETS[st] };
  try { parseSiteConfig(c); ok(`theme "${st}" is a valid site theme`, true); } catch (e) { ok(`theme "${st}" is a valid site theme`, false, (e as Error).message); }
  const v = themeVars(STYLE_PRESETS[st]);
  ok(`theme "${st}" sets every CSS variable`, ["--brand", "--accent", "--ink", "--paper", "--on-brand", "--on-accent", "--radius"].every((k) => !!v[k]));
}
ok("dark brand gets white button text", readableOn("#1f4d3a") === "#ffffff");
ok("gold brand (Luxe) gets dark button text", readableOn("#c9a45c") === "#14110f");
ok("white gets dark text", readableOn("#ffffff") === "#14110f");
ok("3-digit hex works", readableOn("#000") === "#ffffff");
for (const st of STYLE_ORDER) for (const k of ["brand", "accent"] as const) {
  const bg = STYLE_PRESETS[st][k]; const fg = readableOn(bg);
  const L = (h: string) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const [a, b] = [L(bg), L(fg)].sort((x, y) => y - x); const ratio = (a + 0.05) / (b + 0.05);
  ok(`${st} ${k}: button text is readable (contrast ${ratio.toFixed(1)}:1, needs 3+)`, ratio >= 3);
}
{ const c = structuredClone(base); c.theme.motion = "off"; ok("motion off is accepted", parseSiteConfig(c).theme.motion === "off"); }
reject("motion set to 'wild'", (c) => (c.theme.motion = "wild"));
for (const st of STYLE_ORDER) {
  const th = STYLE_PRESETS[st]; const ink = th.ink ?? "#1c1917"; const paper = th.paper ?? "#fbf9f5";
  const v = themeVars(th);
  const muted = mixHex(paper, ink, 0.74); // the page secondary-text colour: color-mix(ink 74%, paper)
  ok(`${st}: main text readable (${contrast(ink, paper).toFixed(1)}:1, needs 7)`, contrast(ink, paper) >= 7);
  ok(`${st}: secondary text readable (${contrast(muted, paper).toFixed(1)}:1, needs 4.5)`, contrast(muted, paper) >= 4.5);
  ok(`${st}: link/price colour readable (${contrast(v["--brand-text"], paper).toFixed(1)}:1, needs 4.5)`, contrast(v["--brand-text"], paper) >= 4.5);
  ok(`${st}: small label colour readable (${contrast(v["--accent-text"], paper).toFixed(1)}:1, needs 4.5)`, contrast(v["--accent-text"], paper) >= 4.5);
}
ok("readableText keeps an already-readable colour", readableText("#000000", "#ffffff", "#000000") === "#000000");
ok("readableText darkens a pale yellow on cream", contrast(readableText("#e0a100", "#fffaf0", "#2a1d14"), "#fffaf0") >= 4.5);
ok("swipe left → next", swipeDir(-150, 5, 200) === 1);
ok("swipe right → previous", swipeDir(150, -5, 200) === -1);
ok("tiny move ignored", swipeDir(-30, 0, 100) === 0);
ok("vertical scroll ignored", swipeDir(-20, 300, 200) === 0);
ok("diagonal ignored", swipeDir(-120, 110, 200) === 0);
ok("slow drag ignored", swipeDir(-200, 0, 1500) === 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
