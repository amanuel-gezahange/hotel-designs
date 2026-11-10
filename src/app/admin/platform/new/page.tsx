import Link from "next/link";
import { requireSuper } from "@/lib/auth";
import { CreateClientForm } from "../CreateClientForm";

export default async function NewClient() {
  await requireSuper();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/admin/platform" className="text-sm text-stone-500 hover:text-stone-800">← Back to clients</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New client</h1>
        <p className="text-sm text-stone-500">Creates a website from the template and a login for the hotel owner.</p>
      </div>
      <CreateClientForm />
    </div>
  );
}
