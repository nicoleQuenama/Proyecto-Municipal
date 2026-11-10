"use client";

import type { PreviewZoom } from "./use-preview-zoom";

const BUTTON = "flex h-6 min-w-6 items-center justify-center rounded px-1.5 text-xs text-neutral-700 hover:bg-neutral-200 disabled:opacity-30";

/** Los controles de zoom de una vista previa: acercar, alejar, tamaño real y ajustar al ancho. */
export function ZoomBar({ zoom }: { zoom: PreviewZoom }) {
  return (
    <div role="group" aria-label="Zoom de la vista previa" className="ml-auto flex shrink-0 items-center gap-0.5">
      <button type="button" aria-label="Alejar" title="Alejar" disabled={zoom.atMin} onClick={zoom.zoomOut} className={`${BUTTON} cursor-pointer`}>
        −
      </button>
      <span className="w-10 text-center text-[11px] tabular-nums text-neutral-600">{Math.round(zoom.zoom * 100)}%</span>
      <button type="button" aria-label="Acercar" title="Acercar" disabled={zoom.atMax} onClick={zoom.zoomIn} className={`${BUTTON} cursor-pointer`}>
        +
      </button>
      <button type="button" title="Tamaño real (100%)" onClick={zoom.actual} className={`${BUTTON} cursor-pointer`}>
        100%
      </button>
      <button type="button" title="Ajustar al ancho" aria-pressed={zoom.isFit} onClick={zoom.reset} className={`${BUTTON} ${zoom.isFit ? "bg-neutral-200" : ""} cursor-pointer`}>
        Ajustar
      </button>
    </div>
  );
}
