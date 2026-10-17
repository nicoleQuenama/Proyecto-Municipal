"use client";

import { useCurrentPage } from "../site/site-context";
import { useNavigation } from "./navigation-context";

/** Aviso flotante cuando no se está editando: dice qué modo es, cómo salir y qué acaba de pasar. */
export function ModeBar() {
  const { mode, setMode, notice } = useNavigation();
  const page = useCurrentPage();
  if (mode === "edit") return null;

  return (
    // Abajo, sobre la barra de herramientas: arriba taparía los nombres de las páginas.
    <div className="pointer-events-none fixed bottom-[4.75rem] left-1/2 z-50 flex -translate-x-1/2 flex-col-reverse items-center gap-2">
      <div
        role="status"
        className="pointer-events-auto flex items-center gap-3 rounded-full border border-line bg-panel px-4 py-2 text-xs text-ink shadow-2xl"
      >
        {mode === "preview" ? (
          <span>
            <strong className="text-accent">Vista previa</strong> · {page.name} · haz clic en los enlaces
          </span>
        ) : (
          <span>
            <strong className="text-accent">Conectar</strong> · mantén pulsado un elemento y arrastra hasta una
            página del mapa
          </span>
        )}
        <button
          type="button"
          onClick={() => setMode("edit")}
          className="rounded-full bg-hover px-3 py-1 hover:bg-accent hover:text-white"
        >
          Salir (Esc)
        </button>
      </div>

      {notice && (
        <p role="status" className="rounded-lg border border-line bg-panel px-3 py-1.5 text-xs text-ink-dim shadow-2xl">
          {notice}
        </p>
      )}
    </div>
  );
}
