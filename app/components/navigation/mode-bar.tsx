"use client";

import { useCurrentPage } from "../site/site-context";
import { fillRoute } from "../dynamic/route-params";
import { ViewportSwitcher } from "../viewport/viewport-switcher";
import { useNavigation } from "./navigation-context";

/** Aviso flotante en la vista previa: dice dónde estás, cómo salir y qué acaba de pasar. */
export function ModeBar() {
  const { mode, setMode, notice, params } = useNavigation();
  const page = useCurrentPage();
  if (mode === "edit") return null;

  return (
    // Abajo y flotando sobre la página a pantalla completa.
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col-reverse items-center gap-2">
      <div
        role="status"
        className="pointer-events-auto flex items-center gap-3 rounded-full border border-line bg-panel px-4 py-2 text-xs text-ink shadow-2xl"
      >
        <span>
          <strong className="text-accent">Vista previa</strong> · {page.name}
          {page.route && <code className="ml-2 rounded bg-hover px-1.5 py-0.5">{fillRoute(page.route, params)}</code>}
        </span>
        <ViewportSwitcher />
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
