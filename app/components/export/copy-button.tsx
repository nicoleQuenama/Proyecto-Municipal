"use client";

import { useState } from "react";

/** Copia un texto al portapapeles; si el navegador no lo permite, lo dice para que se copie a mano. */
export function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("done");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2500);
  };

  return (
    <button type="button" onClick={copy} className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-white hover:opacity-90">
      {state === "done" ? "¡Copiado!" : state === "failed" ? "No se pudo: selecciona y copia" : label}
    </button>
  );
}

/** Descarga un texto como archivo. */
export function DownloadButton({ text, filename }: { text: string; filename: string }) {
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: filename });
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button type="button" onClick={download} className="h-8 rounded-md border border-line px-3 text-xs hover:bg-hover">
      Descargar
    </button>
  );
}
