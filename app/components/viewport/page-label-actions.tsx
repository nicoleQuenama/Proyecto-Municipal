"use client";

import { useEffect, useRef, useState } from "react";
import { useSiteDispatch } from "../site/site-context";
import type { Page } from "../site/types";
import { plural } from "../versioning/versioning-rules";

const small =
  "flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs text-ink-dim hover:bg-hover hover:text-ink transition-colors";

/** Lo que la etiqueta de una página en el lienzo ofrece: hacerla la de inicio y eliminarla (con confirmación emergente segura). */
export function PageLabelActions({ page }: { page: Page }) {
  const dispatch = useSiteDispatch();
  const [confirming, setConfirming] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Cerrar confirmación al hacer clic fuera o presionar la tecla Escape
  useEffect(() => {
    if (!confirming) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setConfirming(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setConfirming(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [confirming]);

  return (
    <div className="relative flex items-center gap-0.5">
      {/* Botón de Página de Inicio */}
      <button
        type="button"
        aria-label={page.isHome ? `${page.name} es la página de inicio` : `Usar ${page.name} como página de inicio`}
        title={page.isHome ? "Es la página de inicio (portada del sitio)" : "Convertir en página de inicio"}
        aria-pressed={page.isHome}
        disabled={page.isHome}
        onClick={() => dispatch({ type: "page/home", id: page.id })}
        className={`${small} ${page.isHome ? "text-accent font-bold cursor-default" : "cursor-pointer"}`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </button>

      {/* Botón de Eliminar (la página de inicio no se puede eliminar, por lo que no se muestra para evitar clics accidentales) */}
      {!page.isHome && (
        <button
          type="button"
          aria-label={`Eliminar la página ${page.name}`}
          title="Eliminar esta página"
          onClick={() => setConfirming(true)}
          className={`${small} hover:bg-red-500/15 hover:text-red-500 cursor-pointer`}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>
      )}

      {/* Popover flotante seguro de confirmación */}
      {confirming && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={`Confirmar eliminación de ${page.name}`}
          className="absolute right-0 top-full mt-1.5 z-50 w-72 rounded-xl border border-line bg-panel p-3.5 shadow-2xl backdrop-blur-md text-xs animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="font-semibold text-ink text-sm">¿Eliminar página?</span>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="flex h-5 w-5 items-center justify-center rounded text-ink-dim hover:bg-hover hover:text-ink transition-colors cursor-pointer"
              title="Cerrar (Esc)"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M2 2l12 12M14 2L2 14" />
              </svg>
            </button>
          </div>
          <p className="text-ink-dim leading-relaxed mb-3">
            Se perderán {plural(page.blocks.length, "bloque", "bloques")} y {plural(page.media.length, "medio", "medios")} de la página{" "}
            <strong className="text-ink font-semibold">«{page.name}»</strong>. Esta acción no se puede deshacer.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/60">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-md border border-line bg-canvas px-3 py-1.5 font-medium text-ink hover:bg-hover transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                dispatch({ type: "page/delete", id: page.id });
              }}
              className="rounded-md bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
