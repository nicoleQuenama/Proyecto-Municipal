"use client";

import { describeSuggestions, suggestAll } from "../responsive/adapt-suggest";
import { describeSummary, summarizeAdaptation } from "../responsive/adapt-summary";
import { availableWidth, DEVICE_NAME, isAdaptive } from "../responsive/devices";
import { MARGIN_LIMITS, sideMargin } from "../responsive/page-margin";
import { useCurrentPage, useSite, useSiteDispatch } from "../site/site-context";
import { copiesFrom } from "./suggest-copies";
import { useViewport } from "./viewport-context";

const button = "h-7 rounded-full px-3 text-[11px] font-medium transition-colors";

/**
 * El asistente responsive: en tablet y móvil, un botón que adapta todas las secciones de la página con la
 * estrategia inteligente, el resumen de lo adaptado y el margen lateral de la página en ese dispositivo.
 */
export function AdaptAssistant() {
  const { device } = useViewport();
  const page = useCurrentPage();
  const dispatch = useSiteDispatch();
  const { components, sources } = useSite();
  if (!isAdaptive(device) || !page) return null;

  const summary = summarizeAdaptation(page.blocks, device);
  const name = DEVICE_NAME[device].plain;
  const adaptAll = (includeManual: boolean) => dispatch({ type: "responsive/adapt-page", pageId: page.id, device, includeManual });

  // Ideas para cada sección (cabecera → menú, lista larga → carrusel, sección alta → «Ver más»).
  const suggestions = suggestAll(page.blocks, components, {
    device,
    available: availableWidth(device, sideMargin(device, page.sideMargin)),
    copies: copiesFrom(sources),
  });

  return (
    <div
      role="region"
      aria-label={`Asistente responsive para ${name}`}
      className="absolute bottom-[8.5rem] left-1/2 z-30 flex w-max max-w-[calc(100%-1rem)] -translate-x-1/2 flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-line bg-panel px-3 py-2 text-xs text-ink shadow-2xl"
    >
      <button type="button" onClick={() => adaptAll(false)} className={`${button} bg-accent text-white hover:opacity-90`}>
        Adaptar toda la página a {name}
      </button>
      <span className="text-ink-dim" aria-live="polite">{describeSummary(summary)}</span>
      <span className="text-ink-dim" aria-live="polite" title={suggestions.map((s) => s.reason).join(" · ")}>
        {describeSuggestions(suggestions)}
      </span>
      {suggestions.length > 0 && (
        <button
          type="button"
          onClick={() => dispatch({ type: "responsive/suggest", pageId: page.id, device, changes: suggestions })}
          className={`${button} bg-emerald-600 text-white hover:opacity-90`}
        >
          Aplicar sugerencias
        </button>
      )}
      {summary.manual > 0 && (
        <button type="button" onClick={() => adaptAll(true)} className={`${button} border border-line text-ink-dim hover:bg-hover hover:text-ink`}>
          Volver también las manuales a automático
        </button>
      )}
      <label className="flex items-center gap-1.5 text-ink-dim">
        Margen lateral
        <input
          type="number"
          min={MARGIN_LIMITS.min}
          max={MARGIN_LIMITS.max}
          aria-label={`Margen lateral en ${name}`}
          value={sideMargin(device, page.sideMargin)}
          onChange={(e) => dispatch({ type: "responsive/margin", pageId: page.id, device, margin: e.target.value === "" ? null : Number(e.target.value) })}
          className="h-7 w-14 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent"
        />
        px
      </label>
    </div>
  );
}
