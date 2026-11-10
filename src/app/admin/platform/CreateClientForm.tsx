"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createClient } from "../actions";

const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
const input = "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-800";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
    </label>
  );
}

export function CreateClientForm() {
  const [state, action, pending] = useActionState(createClient, undefined);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [touched, setTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState("");

  function generate() {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = crypto.getRandomValues(new Uint8Array(12));
    setPassword(Array.from(bytes, (b) => chars[b % chars.length]).join(""));
  }

  if (state?.ok) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-lg font-semibold text-emerald-900">Client created</h2>
        <p className="mt-1 text-sm text-emerald-900">{state.ok}</p>
        <p className="mt-1 text-sm text-emerald-900">Temporary password: <b className="font-mono">{password}</b> (copy it now, it is not shown again)</p>
        <div className="mt-5 flex gap-2">
          <Link href={`/admin/site?slug=${slug}`} className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">Fill in the website</Link>
          <Link href="/admin/platform" className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm">Back to clients</Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Hotel</h2>
        <div className="space-y-4">
          <Field label="Hotel name">
            <input
              name="name"
              required
              value={name}
              placeholder="Abay Lodge"
              className={input}
              onChange={(e) => {
                setName(e.target.value);
                if (!touched) setSlug(slugify(e.target.value));
              }}
            />
          </Field>
          <Field label="Short name (web address)" hint={`The built-in address will be ${slug || "short-name"}.localhost:3000. Small letters, numbers and dashes.`}>
            <input
              name="slug"
              required
              value={slug}
              placeholder="abay-lodge"
              className={input}
              onChange={(e) => {
                setTouched(true);
                setSlug(slugify(e.target.value));
              }}
            />
          </Field>
          <Field label="Custom domain (optional)" hint="Example: abaylodge.com. You can add it later too.">
            <input name="domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="abaylodge.com" className={input} />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 font-semibold">Owner login</h2>
        <p className="mb-4 text-sm text-stone-500">The hotel owner uses this to edit their website and read booking inquiries.</p>
        <div className="space-y-4">
          <Field label="Owner email">
            <input name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@example.com" className={input} />
          </Field>
          <Field label="Temporary password" hint="At least 8 characters. Share it with the owner.">
            <div className="flex gap-2">
              <input name="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={`${input} font-mono`} />
              <button type="button" onClick={generate} className="shrink-0 rounded-md border border-stone-300 px-3 text-sm hover:bg-stone-100">Generate</button>
            </div>
          </Field>
        </div>
      </section>

      {state?.error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <Link href="/admin/platform" className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm hover:bg-stone-100">Cancel</Link>
        <button disabled={pending} className="rounded-md bg-stone-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
          {pending ? "Creating…" : "Create client"}
        </button>
      </div>
    </form>
  );
}
