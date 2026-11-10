import fs from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import type { SiteConfig } from "./types";

/**
 * Local dev: a SQLite file in ./data. Production: set DATABASE_URL (+ DATABASE_AUTH_TOKEN)
 * to a Turso/libSQL database and nothing else changes.
 */
const g = globalThis as unknown as { __db?: Client; __dbReady?: Promise<void> };

function client(): Client {
  if (!g.__db) {
    const url = process.env.DATABASE_URL ?? "file:data/stay.db";
    if (url.startsWith("file:")) fs.mkdirSync(path.dirname(url.slice(5)), { recursive: true });
    g.__db = createClient({
      url,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  }
  return g.__db;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS sites (
    slug TEXT PRIMARY KEY,
    domain TEXT UNIQUE,
    config TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super','owner')),
    site_slug TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_slug TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    check_in TEXT,
    check_out TEXT,
    guests INTEGER,
    room TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_inquiries_site ON inquiries (site_slug, created_at DESC)`,
];

async function db(): Promise<Client> {
  const c = client();
  g.__dbReady ??= c.batch(SCHEMA, "write").then(() => undefined);
  await g.__dbReady;
  return c;
}

/* ---------- sites ---------- */

/** Public sites only see active clients; admins can pass includeInactive to edit a disabled one. */
export async function getSiteConfig(slug: string, includeInactive = false): Promise<SiteConfig | null> {
  const r = await (await db()).execute({
    sql: `SELECT config FROM sites WHERE slug = ?${includeInactive ? "" : " AND active = 1"}`,
    args: [slug],
  });
  return r.rows[0] ? (JSON.parse(String(r.rows[0].config)) as SiteConfig) : null;
}

export async function saveSiteConfig(slug: string, config: SiteConfig) {
  await (await db()).execute({
    sql: "UPDATE sites SET config = ? WHERE slug = ?",
    args: [JSON.stringify(config), slug],
  });
}

export async function createSite(slug: string, config: SiteConfig, domain?: string | null) {
  await (await db()).execute({
    sql: "INSERT INTO sites (slug, domain, config) VALUES (?, ?, ?)",
    args: [slug, domain || null, JSON.stringify(config)],
  });
}

export async function upsertSite(slug: string, config: SiteConfig) {
  await (await db()).execute({
    sql: `INSERT INTO sites (slug, config) VALUES (?, ?)
          ON CONFLICT(slug) DO UPDATE SET config = excluded.config`,
    args: [slug, JSON.stringify(config)],
  });
}

export async function setSiteDomain(slug: string, domain: string | null) {
  await (await db()).execute({
    sql: "UPDATE sites SET domain = ? WHERE slug = ?",
    args: [domain || null, slug],
  });
}

export async function setSiteActive(slug: string, active: boolean) {
  await (await db()).execute({
    sql: "UPDATE sites SET active = ? WHERE slug = ?",
    args: [active ? 1 : 0, slug],
  });
}

export async function slugForDomain(host: string): Promise<string | null> {
  const r = await (await db()).execute({
    sql: "SELECT slug FROM sites WHERE domain = ? AND active = 1",
    args: [host],
  });
  return r.rows[0] ? String(r.rows[0].slug) : null;
}

export async function listSites() {
  const r = await (await db()).execute(
    `SELECT s.slug, s.domain, s.active, s.created_at,
            json_extract(s.config, '$.name') AS name,
            (SELECT COUNT(*) FROM inquiries i WHERE i.site_slug = s.slug AND i.status = 'new') AS new_inquiries
     FROM sites s ORDER BY s.created_at DESC`,
  );
  return r.rows.map((x) => ({
    slug: String(x.slug),
    domain: x.domain ? String(x.domain) : null,
    active: Number(x.active) === 1,
    name: String(x.name ?? x.slug),
    newInquiries: Number(x.new_inquiries),
  }));
}

/* ---------- users ---------- */

export interface UserRow {
  id: number;
  email: string;
  passwordHash: string;
  role: "super" | "owner";
  siteSlug: string | null;
}

export async function findUser(email: string): Promise<UserRow | null> {
  const r = await (await db()).execute({
    sql: "SELECT * FROM users WHERE email = ?",
    args: [email.trim().toLowerCase()],
  });
  const x = r.rows[0];
  return x
    ? {
        id: Number(x.id),
        email: String(x.email),
        passwordHash: String(x.password_hash),
        role: x.role as "super" | "owner",
        siteSlug: x.site_slug ? String(x.site_slug) : null,
      }
    : null;
}

export async function hasSuper(): Promise<boolean> {
  const r = await (await db()).execute("SELECT 1 FROM users WHERE role = 'super' LIMIT 1");
  return r.rows.length > 0;
}

export async function upsertUser(
  email: string,
  passwordHash: string,
  role: "super" | "owner",
  siteSlug: string | null,
) {
  await (await db()).execute({
    sql: `INSERT INTO users (email, password_hash, role, site_slug) VALUES (?, ?, ?, ?)
          ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash,
            role = excluded.role, site_slug = excluded.site_slug`,
    args: [email.trim().toLowerCase(), passwordHash, role, siteSlug],
  });
}

/* ---------- inquiries ---------- */

export interface Inquiry {
  id: number;
  name: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  room: string;
  message: string;
  status: string;
  createdAt: string;
}

export async function addInquiry(
  slug: string,
  i: Omit<Inquiry, "id" | "status" | "createdAt">,
) {
  await (await db()).execute({
    sql: `INSERT INTO inquiries (site_slug, name, phone, check_in, check_out, guests, room, message)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [slug, i.name, i.phone, i.checkIn, i.checkOut, i.guests, i.room, i.message],
  });
}

export async function listInquiries(slug: string, limit = 200): Promise<Inquiry[]> {
  const r = await (await db()).execute({
    sql: "SELECT * FROM inquiries WHERE site_slug = ? ORDER BY created_at DESC, id DESC LIMIT ?",
    args: [slug, limit],
  });
  return r.rows.map((x) => ({
    id: Number(x.id),
    name: String(x.name),
    phone: String(x.phone ?? ""),
    checkIn: String(x.check_in ?? ""),
    checkOut: String(x.check_out ?? ""),
    guests: Number(x.guests ?? 0),
    room: String(x.room ?? ""),
    message: String(x.message ?? ""),
    status: String(x.status),
    createdAt: String(x.created_at),
  }));
}

export async function setInquiryStatus(slug: string, id: number, status: string) {
  await (await db()).execute({
    sql: "UPDATE inquiries SET status = ? WHERE id = ? AND site_slug = ?",
    args: [status, id, slug],
  });
}
