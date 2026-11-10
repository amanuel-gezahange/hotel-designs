import { redirect } from "next/navigation";
import { listInquiries } from "@/lib/db";
import { canManage, requireSession } from "@/lib/auth";
import { updateInquiry } from "./actions";

const STATUSES = ["new", "contacted", "confirmed", "cancelled"] as const;
const COLORS: Record<string, string> = {
  new: "bg-amber-100 text-amber-800",
  contacted: "bg-sky-100 text-sky-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-stone-200 text-stone-600",
};

/** Ethiopian local numbers (09…) -> international digits for wa.me links. */
function waDigits(phone: string) {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("0") ? `251${d.slice(1)}` : d;
}

export default async function Inbox({ searchParams }: { searchParams: Promise<{ slug?: string }> }) {
  const s = await requireSession();
  const slug = s.role === "super" ? (await searchParams).slug : s.siteSlug;
  if (!slug) redirect("/admin/platform");
  if (!canManage(s, slug)) redirect("/admin");
  const items = await listInquiries(slug);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Booking inquiries</h1>
      <p className="mb-6 text-sm text-stone-500">
        {slug} · every request from the website’s booking form lands here.
      </p>
      {!items.length && <p className="rounded border border-dashed border-stone-300 p-8 text-center text-stone-500">No inquiries yet.</p>}
      <ul className="space-y-3">
        {items.map((i) => (
          <li key={i.id} className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-semibold">{i.name}</span>
                {i.phone && (
                  <>
                    {" · "}
                    <a className="text-emerald-700 underline" href={`https://wa.me/${waDigits(i.phone)}`} target="_blank" rel="noopener">
                      {i.phone}
                    </a>
                  </>
                )}
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[i.status]}`}>{i.status}</span>
            </div>
            <p className="mt-1 text-sm text-stone-600">
              {i.room || "Any room"} · {i.checkIn} → {i.checkOut} · {i.guests} guest{i.guests === 1 ? "" : "s"}
            </p>
            <p className="mt-0.5 text-xs text-stone-400">{i.createdAt} UTC</p>
            <div className="mt-3 flex gap-2">
              {STATUSES.filter((x) => x !== i.status).map((x) => (
                <form key={x} action={updateInquiry.bind(null, slug, i.id, x)}>
                  <button className="rounded border border-stone-300 px-2.5 py-1 text-xs hover:bg-stone-100">
                    Mark {x}
                  </button>
                </form>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
