import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";

const COOKIE = "sk_session";
const secret = () => {
  const s = process.env.AUTH_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set");
  return new TextEncoder().encode(s ?? "dev-only-secret-change-me-please-32chars");
};

export interface Session {
  email: string;
  role: "super" | "owner";
  siteSlug: string | null;
}

export async function createSession(s: Session) {
  const token = await new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      email: String(payload.email),
      role: payload.role as Session["role"],
      siteSlug: (payload.siteSlug as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return s;
}

export async function requireSuper(): Promise<Session> {
  const s = await requireSession();
  if (s.role !== "super") redirect("/admin");
  return s;
}

/** Owners may only touch their own site; super admins may touch any. */
export function canManage(s: Session, slug: string) {
  return s.role === "super" || s.siteSlug === slug;
}
