"use client";

import { useEffect, useRef, useState } from "react";
import { useSite, useSiteDispatch } from "../site/site-context";
import { useNavigation } from "../navigation/navigation-context";
import { searchMunicipalContent, MUNICIPAL_QUICK_SEARCHES, type SearchCategory } from "./search-engine";

export function SearchDialog() {
  const site = useSite();
  const dispatch = useSiteDispatch();
  const navigation = useNavigation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory | "all">("all");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOpenSearch = (e: Event) => {
      const customEvent = e as CustomEvent<{ query?: string }>;
      setQuery(customEvent.detail?.query ?? "");
      setOpen(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    window.addEventListener("cms:open-search", handleOpenSearch);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("cms:open-search", handleOpenSearch);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSelectedCategory("all");
    }
  }, [open]);

  if (!open) return null;

  const rawHits = searchMunicipalContent(site, query);
  const hits =
    selectedCategory === "all"
      ? rawHits
      : rawHits.filter((hit) => hit.category === selectedCategory);

  const handleSelectHit = (pageId?: string) => {
    if (pageId) {
      dispatch({ type: "page/select", id: pageId });
      navigation.followLink?.({ kind: "page", pageId });
    }
    setOpen(false);
  };

  const categories: (SearchCategory | "all")[] = ["all", "Trámite", "Servicio", "Página", "Contacto"];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Búsqueda de trámites y contenidos"
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/70 p-4 pt-12 md:pt-20 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => setOpen(false)}
    >
      <div
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-panel text-ink shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del buscador */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5 bg-canvas/40">
          <svg
            className="h-5 w-5 shrink-0 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar trámites, licencias, patentes, farmacia, subsidios..."
            className="w-full bg-transparent text-sm font-medium text-ink outline-hidden placeholder:text-ink-dim"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="flex h-6 w-6 items-center justify-center rounded-full text-xs text-ink-dim hover:bg-hover hover:text-ink transition-colors"
              title="Borrar texto"
            >
              ✕
            </button>
          )}

          <kbd className="hidden sm:inline-block rounded border border-line bg-canvas px-1.5 py-0.5 text-[10px] font-mono text-ink-dim">
            Esc
          </kbd>
        </div>

        {/* Filtros por Categoría */}
        {query.trim().length > 0 && rawHits.length > 0 && (
          <div className="flex items-center gap-1.5 border-b border-line/60 px-4 py-2 bg-canvas/20 overflow-x-auto text-xs">
            <span className="text-[11px] text-ink-dim font-medium mr-1 shrink-0">Filtrar:</span>
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors shrink-0 ${
                    active
                      ? "bg-accent text-white shadow-xs font-semibold"
                      : "bg-canvas border border-line text-ink-dim hover:text-ink hover:bg-hover"
                  }`}
                >
                  {cat === "all" ? "Todos" : cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Contenido de resultados o sugerencias */}
        <div className="min-h-60 max-h-[60vh] overflow-y-auto p-4 flex flex-col gap-3">
          {query.trim().length === 0 ? (
            <div className="flex flex-col gap-4 py-2">
              <div>
                <span className="text-[11px] font-semibold text-ink-dim uppercase tracking-wider">
                  Búsquedas sugeridas y frecuentes
                </span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {MUNICIPAL_QUICK_SEARCHES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setQuery(item)}
                      className="rounded-lg border border-line bg-canvas px-3 py-1.5 text-xs text-ink font-medium hover:border-accent hover:text-accent hover:bg-accent/5 transition-all active:scale-95 text-left"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-line/60">
                <span className="text-[11px] font-semibold text-ink-dim uppercase tracking-wider">
                  Trámites y servicios destacados
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {hits.slice(0, 4).map((hit) => (
                    <div
                      key={hit.id}
                      onClick={() => handleSelectHit(hit.pageId)}
                      className="flex flex-col gap-1 rounded-xl border border-line/80 bg-canvas/60 p-3 hover:border-accent hover:bg-accent/5 hover:shadow-xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${hit.badgeClass}`}>
                          {hit.category}
                        </span>
                        <span className="text-[11px] font-semibold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                          Acceder →
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-ink group-hover:text-accent transition-colors line-clamp-1">
                        {hit.title}
                      </p>
                      <p className="text-[11px] text-ink-dim line-clamp-2 leading-snug">
                        {hit.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : hits.length > 0 ? (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-ink-dim px-1">
                {hits.length} {hits.length === 1 ? "resultado encontrado" : "resultados encontrados"}
              </span>
              <ul className="flex flex-col gap-2">
                {hits.map((hit) => (
                  <li
                    key={hit.id}
                    onClick={() => handleSelectHit(hit.pageId)}
                    className="flex items-start justify-between gap-3 rounded-xl border border-line bg-canvas p-3.5 hover:border-accent hover:bg-accent/5 hover:shadow-xs transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold shrink-0 ${hit.badgeClass}`}>
                          {hit.category}
                        </span>
                        <h4 className="text-xs sm:text-sm font-semibold text-ink group-hover:text-accent transition-colors truncate">
                          {hit.title}
                        </h4>
                      </div>
                      <p className="text-xs text-ink-dim line-clamp-2 leading-relaxed">
                        {hit.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-lg bg-accent/10 px-2.5 py-1.5 text-xs font-semibold text-accent group-hover:bg-accent group-hover:text-white transition-colors"
                    >
                      Ver trámite →
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <svg className="h-10 w-10 text-ink-dim/50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm font-semibold text-ink">
                No se encontraron trámites o páginas para &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-ink-dim mt-1 max-w-sm">
                Prueba buscando por palabras clave generales como: <span className="text-accent font-medium">patentes, salud, subsidio, certificado</span> o selecciona una sugerencia.
              </p>
            </div>
          )}
        </div>

        {/* Pie del diálogo con atajos */}
        <footer className="flex items-center justify-between border-t border-line bg-canvas/60 px-4 py-2.5 text-[11px] text-ink-dim">
          <span>Portal Municipal · Búsqueda inteligente</span>
          <span className="flex items-center gap-2">
            <span>Presiona <kbd className="rounded border border-line bg-canvas px-1 py-0.5 font-mono text-[10px]">Esc</kbd> para salir</span>
          </span>
        </footer>
      </div>
    </div>
  );
}
