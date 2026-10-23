"use client";

import { useState } from "react";
import { useExternal } from "./external-context";
import type { AddedPage } from "./types";

const slugOf = (title: string) =>
  `/${title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

/** Páginas nuevas para la web del cliente: tienen su dirección y su contenido en HTML sencillo. */
export function AddedPages() {
  const { state, dispatch } = useExternal();
  const [draft, setDraft] = useState<AddedPage | null>(null);

  const save = () => {
    if (!draft?.title.trim() || draft.path === "/") return;
    dispatch({ type: "added-page/save", page: { ...draft, title: draft.title.trim() } });
    setDraft(null);
  };

  return (
    <div className="flex flex-col gap-2">
      {state.pages.map((page) => (
        <div key={page.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-hover">
          <button type="button" onClick={() => setDraft(page)} className="min-w-0 flex-1 text-left">
            <span className="block truncate">{page.title}</span>
            <span className="block truncate font-mono text-ink-dim">{page.path}</span>
          </button>
          <button
            type="button"
            aria-label={`Quitar la página ${page.title}`}
            onClick={() => dispatch({ type: "added-page/remove", id: page.id })}
            className="shrink-0 rounded px-1.5 text-ink-dim hover:bg-black/30 hover:text-ink"
          >
            ×
          </button>
        </div>
      ))}

      {draft ? (
        <div className="flex flex-col gap-2 rounded-md border border-line p-2">
          <input
            aria-label="Título de la página nueva"
            placeholder="Título (p. ej. Preguntas frecuentes)"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value, path: slugOf(e.target.value) })}
            className="h-8 rounded-md border border-line bg-canvas px-2 text-[13px] outline-none focus:border-accent"
          />
          <input
            aria-label="Dirección de la página nueva"
            value={draft.path}
            onChange={(e) => setDraft({ ...draft, path: e.target.value.startsWith("/") ? e.target.value : `/${e.target.value}` })}
            className="h-8 rounded-md border border-line bg-canvas px-2 font-mono text-xs outline-none focus:border-accent"
          />
          <textarea
            aria-label="Contenido de la página nueva"
            rows={6}
            placeholder="<h1>Título</h1><p>Texto…</p>"
            value={draft.html}
            onChange={(e) => setDraft({ ...draft, html: e.target.value })}
            className="rounded-md border border-line bg-canvas p-2 font-mono text-xs outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            <button type="button" onClick={save} className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-white">
              Guardar página
            </button>
            <button type="button" onClick={() => setDraft(null)} className="h-8 rounded-md px-3 text-xs text-ink-dim hover:bg-hover">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setDraft({ id: `added-${Date.now().toString(36)}`, path: "/", title: "", html: "" })}
          className="h-8 self-start rounded-md bg-hover px-3 text-xs hover:bg-accent/25"
        >
          + Página nueva
        </button>
      )}
    </div>
  );
}
