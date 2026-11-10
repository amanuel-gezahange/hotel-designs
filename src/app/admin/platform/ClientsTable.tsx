"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DownloadButton } from "../DownloadButton";
import { toggleClient, updateClient } from "../actions";

export interface Row {
  slug: string;
  name: string;
  domain: string | null;
  active: boolean;
  newInquiries: number;
  siteUrl: string;
}

const initials = (n: string) =>
  n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

function RowMenu({ row, onDomain }: { row: Row; onDomain: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const item = "block w-full px-3 py-2 text-left text-sm hover:bg-stone-50";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`More actions for ${row.name}`}
        onClick={() => setOpen(!open)}
        className="grid h-8 w-8 place-items-center rounded-md border border-stone-200 text-stone-600 hover:bg-stone-100"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
          <a className={item} target="_blank" href={`${row.siteUrl}/en?themes`}>Preview all designs</a>
          <a className={item} href={`/admin?slug=${row.slug}`}>
            Booking inquiries{row.newInquiries > 0 && <span className="ml-2 rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-800">{row.newInquiries}</span>}
          </a>
          <button type="button" className={item} onClick={() => { setOpen(false); onDomain(); }}>Custom domain…</button>
          <DownloadButton slug={row.slug} label="Download website (zip)" menu />
          <div className="my-1 border-t border-stone-100" />
          <form action={toggleClient.bind(null, row.slug, !row.active)}>
            <button className={`${item} ${row.active ? "text-red-700" : "text-emerald-700"}`}>
              {row.active ? "Disable website" : "Enable website"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export function ClientsTable({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "live" | "off">("all");
  const [domainFor, setDomainFor] = useState<Row | null>(null);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (filter === "all" || (filter === "live" ? r.active : !r.active)) &&
        (!needle || `${r.name} ${r.slug} ${r.domain ?? ""}`.toLowerCase().includes(needle)),
    );
  }, [rows, q, filter]);

  const tab = (id: typeof filter, label: string, n: number) => (
    <button
      key={id}
      onClick={() => setFilter(id)}
      className={`rounded-md px-3 py-1.5 text-sm font-medium ${filter === id ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`}
    >
      {label} <span className={filter === id ? "text-stone-300" : "text-stone-400"}>{n}</span>
    </button>
  );

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 p-3">
        <div className="flex gap-1">
          {tab("all", "All", rows.length)}
          {tab("live", "Live", rows.filter((r) => r.active).length)}
          {tab("off", "Disabled", rows.filter((r) => !r.active).length)}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search hotels…"
          className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm outline-none focus:border-stone-800 sm:w-64"
        />
      </div>

      <table className="w-full text-left text-sm">
        <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
          <tr>
            <th className="px-4 py-2.5 font-medium">Hotel</th>
            <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Status</th>
            <th className="hidden px-4 py-2.5 font-medium md:table-cell">Domain</th>
            <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Inquiries</th>
            <th className="px-4 py-2.5 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {shown.map((r) => (
            <tr key={r.slug} className="hover:bg-stone-50/70">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-stone-100 text-xs font-semibold text-stone-600">{initials(r.name)}</span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.name}</p>
                    <p className="truncate text-xs text-stone-500">{r.slug}{!r.active && <span className="ml-1.5 rounded bg-stone-200 px-1.5 text-stone-600 sm:hidden">disabled</span>}</p>
                  </div>
                </div>
              </td>
              <td className="hidden px-4 py-3 sm:table-cell">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${r.active ? "bg-emerald-50 text-emerald-700" : "bg-stone-200 text-stone-600"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${r.active ? "bg-emerald-500" : "bg-stone-400"}`} />
                  {r.active ? "Live" : "Disabled"}
                </span>
              </td>
              <td className="hidden px-4 py-3 md:table-cell">
                {r.domain ? <a href={`https://${r.domain}`} target="_blank" className="text-stone-700 hover:underline">{r.domain}</a> : <span className="text-stone-400">Not set</span>}
              </td>
              <td className="hidden px-4 py-3 sm:table-cell">
                {r.newInquiries > 0 ? (
                  <a href={`/admin?slug=${r.slug}`} className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">{r.newInquiries} new</a>
                ) : (
                  <span className="text-stone-400">None</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <a href={r.siteUrl} target="_blank" className="hidden rounded-md border border-stone-200 px-3 py-1.5 text-sm hover:bg-stone-100 sm:block">View</a>
                  <a href={`/admin/site?slug=${r.slug}`} className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700">Edit</a>
                  <RowMenu row={r} onDomain={() => setDomainFor(r)} />
                </div>
              </td>
            </tr>
          ))}
          {shown.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-14 text-center text-stone-500">
                {rows.length === 0 ? "No hotels yet. Click “New client” to add the first one." : "No hotels match your search."}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {domainFor && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4" onMouseDown={() => setDomainFor(null)}>
          <form
            onMouseDown={(e) => e.stopPropagation()}
            action={async (fd) => {
              await updateClient(domainFor.slug, fd);
              setDomainFor(null);
            }}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold">Custom domain</h2>
            <p className="mb-4 text-sm text-stone-500">For {domainFor.name}. Leave empty to remove it.</p>
            <input
              name="domain"
              autoFocus
              defaultValue={domainFor.domain ?? ""}
              placeholder="e.g. abaylodge.com"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-800"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setDomainFor(null)} className="rounded-md border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100">Cancel</button>
              <button className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
