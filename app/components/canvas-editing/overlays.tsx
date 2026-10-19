import type { CanvasElement, DockAlign, DockSlot } from "../site/types";
import { GRID_SIZE, type Guides } from "./snapping";

const GRID_LINES =
  "linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)";

/** La cuadrícula, encima del lienzo y sin estorbar al ratón. */
export function GridOverlay() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-60"
      style={{ backgroundImage: GRID_LINES, backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px` }}
    />
  );
}

/** Las líneas guía activas: cruzan todo el lienzo y desaparecen al soltar. */
export function GuideLines({ guides, width, height }: { guides: Guides; width: number; height: number }) {
  return (
    <>
      {guides.x.map((x) => (
        <span key={`x${x}`} aria-hidden className="pointer-events-none absolute top-0 w-px bg-rose-500" style={{ left: x, height }} />
      ))}
      {guides.y.map((y) => (
        <span key={`y${y}`} aria-hidden className="pointer-events-none absolute left-0 h-px bg-rose-500" style={{ top: y, width }} />
      ))}
    </>
  );
}

const THIRD_INDEX: Record<DockAlign, number> = { start: 0, center: 1, end: 2 };

/** El contenedor que recibirá al elemento y, si queda cerca de una, la casilla donde encajará. */
export function DropPreview({ parent, slot }: { parent: CanvasElement; slot: DockSlot | null }) {
  const cellWidth = parent.width / 3;
  const cellHeight = parent.height / 3;

  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute border-2 border-dashed border-emerald-500"
        style={{ left: parent.x, top: parent.y, width: parent.width, height: parent.height }}
      />
      {slot && (
        <span
          aria-hidden
          className="pointer-events-none absolute bg-emerald-500/25"
          style={{
            left: parent.x + THIRD_INDEX[slot.h] * cellWidth,
            top: parent.y + THIRD_INDEX[slot.v] * cellHeight,
            width: cellWidth,
            height: cellHeight,
          }}
        />
      )}
    </>
  );
}
