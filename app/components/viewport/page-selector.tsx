"use client";

import { useMemo, useRef, useState } from "react";
import { routeOf } from "../site/rules";
import { useSite, useSiteDispatch } from "../site/site-context";
import { UnitTag } from "../units/unit-tag";
import { TopLayer } from "../ui/top-layer";
import { useDismiss } from "../ui/use-dismiss";
import { idle, pill } from "./toolbar-parts";

/** Selector de página de la barra del lienzo: cambia de página sin abrir el panel lateral. */
export function PageSelector() {
  const { pages, currentPageId } = useSite();
  const dispatch = useSiteDispatch();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useDismiss(ref, open, () => setOpen(false));

  const current = pages.find((page) => page.id === currentPageId) ?? pages[0];
  const term = query.trim().toLowerCase();
  const matches = useMemo(
    () => pages.filter((page) => page.name.toLowerCase().includes(term)),
    [pages, term],
  );

  const select = (id: string) => {
    dispatch({ type: "page/select", id });
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={ref} className="relative">
      <button
        ref={button}
        type="button"
        aria-label={`Página actual: ${current.name}. Cambiar de página`}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Cambiar de página"
        onClick={() => setOpen((value) => !value)}
        className={`${pill} bg-canvas ${idle} cursor-pointer`}
      >
        <span className="max-w-28 truncate">{current.name}</span>
        <span aria-hidden className="text-ink-dim">▾</span>
      </button>

      {open && (
        <TopLayer
          anchorRef={button}
          side="top"
          className="w-64 rounded-lg border border-line bg-panel p-1 text-ink shadow-2xl"
        >
          <input
            autoFocus
            aria-label="Buscar página"
            placeholder="Buscar página…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mb-1 h-8 w-full rounded-md border border-line bg-canvas px-2 text-xs outline-none placeholder:text-ink-dim focus:border-accent"
          />
          <ul role="listbox" aria-label="Páginas" className="max-h-72 overflow-y-auto">
            {matches.map((page) => (
              <li key={page.id} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={page.id === currentPageId}
                  onClick={() => select(page.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-hover ${
                    page.id === currentPageId ? "text-accent" : "text-ink"
                  } cursor-pointer`}
                >
                  <span className={`min-w-0 flex-1 truncate ${page.hidden && !page.isHome ? "text-ink-dim" : ""}`}>{page.name}</span>
                  {page.hidden && !page.isHome && (
                    <span className="shrink-0 rounded bg-amber-500/15 px-1 py-0.2 text-[9px] font-semibold text-amber-600 uppercase">
                      Oculta
                    </span>
                  )}
                  <UnitTag page={page} />
                  <span className="shrink-0 font-mono text-[10px] text-ink-dim">{routeOf(page)}</span>
                </button>
              </li>
            ))}
          </ul>
          {matches.length === 0 && (
            <p className="px-2 py-3 text-center text-[11px] text-ink-dim">No hay páginas con ese nombre.</p>
          )}
        </TopLayer>
      )}
    </div>
  );
}
