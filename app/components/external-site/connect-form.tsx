"use client";

import { useState, type FormEvent } from "react";
import { useExternal } from "./external-context";

/** El primer paso: la dirección de la página que el cliente ya tiene publicada. */
export function ConnectForm() {
  const { status, open, setEditorOpen } = useExternal();
  const [url, setUrl] = useState("");
  const loading = status.kind === "loading";

  const connect = async (e: FormEvent) => {
    e.preventDefault();
    if (await open(url)) setEditorOpen(true);
  };

  return (
    <form onSubmit={connect} className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-ink-dim">
        Conecta la web que ya tiene tu cliente. Podrás cambiar textos, imágenes y estilos, agregar elementos o
        páginas, y al publicar se actualiza su página oficial, sin rehacerla.
      </p>
      <input
        aria-label="Dirección de la web"
        placeholder="https://miweb.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="h-9 rounded-md border border-line bg-canvas px-3 text-[13px] outline-none placeholder:text-ink-dim focus:border-accent"
      />
      {status.kind === "error" && (
        <p role="alert" className="text-xs text-red-400">
          {status.message}
        </p>
      )}
      <button
        type="submit"
        disabled={!url.trim() || loading}
        className="h-9 rounded-md bg-accent px-3 text-xs font-medium text-white disabled:opacity-40"
      >
        {loading ? "Abriendo la página…" : "Conectar y editar"}
      </button>
    </form>
  );
}
