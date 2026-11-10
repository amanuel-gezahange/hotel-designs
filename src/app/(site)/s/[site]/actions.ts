"use server";

import { headers } from "next/headers";
import { addInquiry, getSiteConfig } from "@/lib/db";
import { cleanInquiry } from "@/lib/inquiry";
import { tooMany } from "@/lib/ratelimit";
import { SLUG } from "@/lib/validate";
import type { InquiryInput } from "@/lib/types";

/** Receives a booking request from the public website. Treat every value as untrusted. */
export async function submitInquiry(raw: InquiryInput) {
  const i = (raw ?? {}) as unknown as Record<string, unknown>;
  if (i.website) return { ok: true }; // honeypot: bots fill it, people never see it

  const slug = String(i.slug ?? "");
  if (!SLUG.test(slug)) return { ok: false };

  // At most 6 requests per 10 minutes from one address to one hotel
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (tooMany(`inq:${slug}:${ip}`, 6, 10 * 60_000)) return { ok: false };

  const clean = cleanInquiry(i);
  if (!clean) return { ok: false };
  if (!(await getSiteConfig(slug))) return { ok: false };

  await addInquiry(slug, clean);
  return { ok: true };
}
