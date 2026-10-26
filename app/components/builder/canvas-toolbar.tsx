import type { ReactNode } from "react";
import { CanvasToggles } from "../canvas-editing/canvas-toggles";
import { MAX_CANVAS_HEIGHT, MAX_CANVAS_WIDTH, type Size } from "../canvas-editing/limits";

/** Opciones de ayuda del lienzo, el zoom y su tamaño actual frente al máximo permitido. */
export function CanvasToolbar({ size, zoomBar }: { size: Size; zoomBar: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-1.5 text-xs">
      <CanvasToggles />
      <span className="ml-auto text-ink-dim">
        {size.width} × {size.height} px · máx. {MAX_CANVAS_WIDTH} × {MAX_CANVAS_HEIGHT}
      </span>
      {zoomBar}
    </div>
  );
}
