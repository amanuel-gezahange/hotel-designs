"use client";

import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm({ firstRun }: { firstRun: boolean }) {
  const [state, action, pending] = useActionState(login, undefined);
  const input = "w-full rounded border border-stone-300 bg-white px-3 py-2 outline-none focus:border-stone-800";
  return (
    <form action={action} className="mx-auto mt-16 max-w-sm space-y-4 rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">{firstRun ? "Create your admin account" : "Sign in"}</h1>
      {firstRun && <p className="text-sm text-stone-600">First time here. Type the email and password you want to use. This becomes your login.</p>}
      <label className="block text-sm">
        Email
        <input name="email" type="email" required autoComplete="username" className={input} />
      </label>
      <label className="block text-sm">
        Password
        <input name="password" type="password" required autoComplete="current-password" className={input} />
      </label>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="w-full rounded bg-stone-900 py-2 font-medium text-white disabled:opacity-50">
        {pending ? "Please wait…" : firstRun ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
