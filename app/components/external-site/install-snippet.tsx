"use client";

import { useState } from "react";
import { useExternal } from "./external-context";
import { installSnippet } from "./runtime-script";

/** La etiqueta que se pega una sola vez en la web del cliente; después, cada publicación se aplica sola. */
export function InstallSnippet() {
  const { state } = useExternal();
  const [copied, setCopied] = useState(false);
  if (!state.site) return null;

  const snippet = installSnippet(window.location.origin, state.site);
  const copy = async () => {
    await navigator.clipboard.writeText(snippet).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs leading-relaxed text-ink-dim">
        Pega esta línea una sola vez dentro de <code>&lt;head&gt;</code> en la web del cliente. Desde entonces, cada
        vez que publiques, su página oficial muestra los cambios.
      </p>
      <pre className="overflow-x-auto rounded-md border border-line bg-canvas p-2 text-[11px] whitespace-pre-wrap break-all">
        {snippet}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="h-8 self-start rounded-md bg-hover px-3 text-xs hover:bg-accent/25"
      >
        {copied ? "¡Copiado!" : "Copiar"}
      </button>
    </div>
  );
}
