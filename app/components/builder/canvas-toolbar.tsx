import { CanvasToggles } from "../canvas-editing/canvas-toggles";
import { MAX_CANVAS_HEIGHT, MAX_CANVAS_WIDTH, type Size } from "../canvas-editing/limits";

/** Opciones de ayuda del lienzo y su tamaño actual frente al máximo permitido. */
export function CanvasToolbar({ size }: { size: Size }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-xs">
      <CanvasToggles />
      <span className="ml-auto text-ink-dim">
        {size.width} × {size.height} px · máx. {MAX_CANVAS_WIDTH} × {MAX_CANVAS_HEIGHT}
      </span>
    </div>
  );
}
