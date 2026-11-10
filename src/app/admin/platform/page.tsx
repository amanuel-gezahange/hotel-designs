import { headers } from "next/headers";
import Link from "next/link";
import { listSites } from "@/lib/db";
import { requireSuper } from "@/lib/auth";
import { loadHotelsFromFolder } from "../actions";
import { ClientsTable } from "./ClientsTable";

export default async function Platform() {
  await requireSuper();
  const sites = await listSites();
  const host = (await headers()).get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";

  const rows = sites.map((s) => ({
    ...s,
    siteUrl: s.domain ? `https://${s.domain}` : `${proto}://${s.slug}.${host}`,
  }));
  const live = sites.filter((s) => s.active).length;
  const inquiries = sites.reduce((n, s) => n + s.newInquiries, 0);

  const stat = (label: string, value: number, tone = "text-stone-900") => (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-stone-500">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tracking-tight ${tone}`}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-stone-500">Every hotel website you manage.</p>
        </div>
        <div className="flex items-center gap-3">
          <form action={loadHotelsFromFolder}>
            <button className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm hover:bg-stone-100" title="Adds hotels found in the sites/ folder that are not here yet">
              Import from folder
            </button>
          </form>
          <Link href="/admin/platform/new" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700">
            + New client
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stat("Total hotels", sites.length)}
        {stat("Live", live, "text-emerald-700")}
        {stat("Disabled", sites.length - live)}
        {stat("New inquiries", inquiries, inquiries ? "text-amber-700" : "text-stone-900")}
      </div>

      <ClientsTable rows={rows} />
    </div>
  );
}
