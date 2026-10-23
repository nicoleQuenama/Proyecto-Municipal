"use client";

import { useState, type FormEvent } from "react";
import { useExternal } from "../external-context";

/** La dirección de la página que se edita; escribir otra de la misma web la abre para editarla también. */
export function AddressBar() {
  const { state, status, open } = useExternal();
  const [draft, setDraft] = useState<string | null>(null);
  const loading = status.kind === "loading";

  const go = async (e: FormEvent) => {
    e.preventDefault();
    if (await open(draft ?? state.pageUrl)) setDraft(null);
  };

  return (
    <form onSubmit={go} className="flex min-w-0 flex-1 flex-col gap-0.5">
      <div className="flex gap-2">
        <input
          aria-label="Dirección de la página"
          value={draft ?? state.pageUrl}
          onChange={(e) => setDraft(e.target.value)}
          className="h-8 min-w-0 flex-1 rounded-md border border-line bg-canvas px-3 font-mono text-xs outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-8 rounded-md bg-hover px-3 text-xs hover:bg-accent/25 disabled:opacity-40"
        >
          {loading ? "Abriendo…" : "Abrir"}
        </button>
      </div>
      {status.kind === "error" && (
        <p role="alert" className="text-[11px] text-red-400">
          {status.message}
        </p>
      )}
    </form>
  );
}
