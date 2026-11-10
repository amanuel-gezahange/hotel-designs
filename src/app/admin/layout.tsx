import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { getSession } from "@/lib/auth";
import { logout } from "./actions";
import { AdminNav, type NavItem } from "./AdminNav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  const items: NavItem[] =
    s?.role === "super"
      ? [
          { href: "/admin/platform", label: "Clients", icon: "clients" },
          { href: "/admin/platform/new", label: "New client", icon: "plus" },
        ]
      : [
          { href: "/admin", label: "Inquiries", icon: "inbox" },
          { href: "/admin/site", label: "Edit website", icon: "edit" },
        ];
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        {s ? (
          <div className="lg:flex">
            <aside className="border-b border-stone-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between gap-3 px-4 py-3 lg:block lg:px-5 lg:py-5">
                <a href="/admin" className="flex items-center gap-2 font-semibold tracking-tight">
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-stone-900 text-xs text-white">S</span>
                  Stay Kit
                </a>
                <div className="lg:hidden"><AdminNav items={items} /></div>
              </div>
              <div className="hidden px-3 lg:block"><AdminNav items={items} /></div>
              <div className="hidden flex-1 lg:block" />
              <form action={logout} className="hidden border-t border-stone-200 p-4 lg:block">
                <p className="truncate text-xs text-stone-500">{s.email}</p>
                <p className="mb-2 text-xs font-medium text-stone-700">{s.role === "super" ? "Operator" : "Hotel owner"}</p>
                <button className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-100">Log out</button>
              </form>
            </aside>
            <main className="min-w-0 flex-1">
              <div className="mx-auto max-w-6xl px-5 py-8 lg:px-10">{children}</div>
            </main>
          </div>
        ) : (
          <div className="mx-auto max-w-6xl px-5 py-8">{children}</div>
        )}
      </body>
    </html>
  );
}
