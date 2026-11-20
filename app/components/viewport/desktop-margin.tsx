"use client";

import { MARGIN_LIMITS, sideMargin } from "../responsive/page-margin";
import { useCurrentPage, useSiteDispatch } from "../site/site-context";
import { useViewport } from "./viewport-context";

/**
 * El margen lateral de la página en escritorio. En tablet y móvil lo cambia el asistente de adaptación; en escritorio
 * es lo que decide si las secciones de 1024 px caben justas en la hoja (0) o con aire a los lados.
 */
export function DesktopMargin() {
  const { device } = useViewport();
  const page = useCurrentPage();
  const dispatch = useSiteDispatch();
  if (device !== "desktop" || !page) return null;

  return (
    <label className="absolute bottom-[8.5rem] left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1 text-[11px] text-ink-dim shadow-lg">
      Margen lateral
      <input
        type="number"
        min={MARGIN_LIMITS.min}
        max={MARGIN_LIMITS.max}
        aria-label="Margen lateral en escritorio"
        value={sideMargin("desktop", page.sideMargin)}
        onChange={(e) => dispatch({ type: "responsive/margin", pageId: page.id, device: "desktop", margin: e.target.value === "" ? null : Number(e.target.value) })}
        className="h-6 w-14 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent"
      />
      px
    </label>
  );
}
