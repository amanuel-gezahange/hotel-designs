"use server";

import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createSite,
  findUser,
  hasSuper,
  getSiteConfig,
  saveSiteConfig,
  setInquiryStatus,
  setSiteActive,
  setSiteDomain,
  upsertUser,
} from "@/lib/db";
import { canManage, createSession, destroySession, requireSession, requireSuper } from "@/lib/auth";
import { sanitizeConfig, normalizeDomain, SLUG, isReservedSlug } from "@/lib/validate";
import { importSites } from "@/lib/import-sites";
import { oneLine } from "@/lib/inquiry";
import { z } from "zod";
import { clearLimit, tooMany } from "@/lib/ratelimit";
import type { SiteConfig } from "@/lib/types";

export type FormState = { error?: string; ok?: string } | undefined;

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 254);
  const password = String(form.get("password") ?? "");
  if (password.length > 200) return { error: "Wrong email or password" }; // no point hashing huge input
  // Slow down password guessing: 8 tries per 10 minutes per email+address
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  const limitKey = `login:${email}:${ip}`;
  if (tooMany(limitKey, 8, 10 * 60_000)) return { error: "Too many attempts. Try again in a few minutes." };
  // First run on a fresh computer: whatever you type becomes the admin account (local use only).
  if (process.env.NODE_ENV !== "production" && !(await hasSuper())) {
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return { error: "Choose a valid email and a password of at least 8 characters." };
    await upsertUser(email, await bcrypt.hash(password, 10), "super", null);
    await importSites();
  }
  const user = await findUser(email);
  // Compare even when the user is missing so response time doesn't reveal which emails exist.
  const hash = user?.passwordHash ?? "$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvali";
  const ok = await bcrypt.compare(password, hash);
  if (!user || !ok) return { error: "Wrong email or password" };
  clearLimit(limitKey);
  await createSession({ email: user.email, role: user.role, siteSlug: user.siteSlug });
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

export async function saveSite(slug: string, json: string): Promise<{ error?: string }> {
  const s = await requireSession();
  if (!canManage(s, slug)) return { error: "Not allowed" };
  try {
    const cfg = sanitizeConfig(JSON.parse(json));
    await saveSiteConfig(slug, cfg);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save" };
  }
  revalidatePath(`/s/${slug}`, "layout"); // refresh the public site right away
  return {};
}

export async function updateInquiry(slug: string, id: number, status: string) {
  const s = await requireSession();
  if (!canManage(s, slug)) return;
  if (!["new", "contacted", "confirmed", "cancelled"].includes(status)) return;
  await setInquiryStatus(slug, id, status);
  revalidatePath("/admin");
}

/* ---------- operator-only ---------- */

export async function createClient(_: FormState, form: FormData): Promise<FormState> {
  await requireSuper();
  const slug = String(form.get("slug") ?? "").trim().toLowerCase();
  const name = oneLine(form.get("name"), 100);
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const rawDomain = String(form.get("domain") ?? "");
  const domain = normalizeDomain(rawDomain);
  const root = (process.env.ROOT_DOMAIN ?? "localhost").toLowerCase();

  if (!SLUG.test(slug)) return { error: "Slug: 2-40 characters, lowercase letters, numbers or dashes (not at the start or end)" };
  if (isReservedSlug(slug)) return { error: `"${slug}" is reserved. Choose another slug` };
  if (!name) return { error: "Property name is required" };
  if (!z.email().max(254).safeParse(email).success) return { error: "Enter a valid owner email" };
  if (password.length < 8) return { error: "Password needs at least 8 characters" };
  // bcrypt silently ignores everything after 72 bytes, so refuse longer passwords
  if (new TextEncoder().encode(password).length > 72) return { error: "Password is too long (max 72 characters)" };
  if (rawDomain.trim() && !domain) return { error: "That custom domain doesn't look valid (example: abaylodge.com)" };
  if (domain && (domain === root || domain.endsWith(`.${root}`)))
    return { error: `Custom domains can't use ${root}: that is your platform address` };
  if (await getSiteConfig(slug, true)) return { error: "That slug is already used" };
  // Never overwrite an existing account (e.g. the operator's own login) by reusing its email
  if (await findUser(email)) return { error: "That email already has an account. Use a different owner email." };

  const tpl = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "sites", "_template", "site.json"), "utf8"),
  ) as SiteConfig;
  tpl.name = name;
  try {
    await createSite(slug, tpl, domain);
  } catch {
    return { error: "Could not create (domain already used?)" };
  }
  await upsertUser(email, await bcrypt.hash(password, 10), "owner", slug);
  revalidatePath("/admin/platform");
  return { ok: `Created ${name}. Owner can log in at /admin with ${email}` };
}

export async function updateClient(slug: string, form: FormData) {
  await requireSuper();
  if (!SLUG.test(slug)) return;
  const raw = String(form.get("domain") ?? "");
  const domain = normalizeDomain(raw);
  const root = (process.env.ROOT_DOMAIN ?? "localhost").toLowerCase();
  if (raw.trim() && !domain) return; // invalid input: ignore rather than store garbage
  if (domain && (domain === root || domain.endsWith(`.${root}`))) return;
  try {
    await setSiteDomain(slug, domain);
  } catch {
    return; // domain already used by another client
  }
  revalidatePath("/admin/platform");
}

export async function toggleClient(slug: string, active: boolean) {
  await requireSuper();
  await setSiteActive(slug, active);
  revalidatePath("/admin/platform");
  revalidatePath(`/s/${slug}`, "layout");
}

export async function loadHotelsFromFolder() {
  await requireSuper();
  await importSites();
  revalidatePath("/admin/platform");
}
