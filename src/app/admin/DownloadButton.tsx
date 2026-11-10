"use client";

import { useState } from "react";

export function DownloadButton({ slug, label = "Download", menu = false }: { slug: string; label?: string; menu?: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [msg, setMsg] = useState("");
  async function go() {
    setState("busy");
    try {
      const res = await fetch(`/api/download?slug=${slug}`);
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setState("idle");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
      setState("error");
    }
  }
  return (
    <span className={menu ? "block" : "inline-flex items-center gap-2"}>
      <button type="button" onClick={go} disabled={state === "busy"} className={menu ? "block w-full px-3 py-2 text-left text-sm hover:bg-stone-50 disabled:opacity-60" : "rounded bg-stone-900 px-2.5 py-1 text-sm text-white disabled:opacity-60"}>
        {state === "busy" ? "Building… (1–2 min)" : label}
      </button>
      {state === "error" && <span className="text-xs text-red-600">{msg}</span>}
    </span>
  );
}
