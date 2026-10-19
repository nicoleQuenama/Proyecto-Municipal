"use client";

import { useRef, useState, type PointerEvent } from "react";
import { MAX_CANVAS_HEIGHT, MAX_CANVAS_WIDTH, type Size } from "./limits";
import { HANDLES, type HandleId } from "./resize-handles";
import { GRID_SIZE } from "./snapping";

/** Los bordes del lienzo que se arrastran para cambiar su tamaño, y dónde se dibuja cada uno (dentro: la página recorta lo que sobresale). */
const EDGE_HANDLES: Partial<Record<HandleId, string>> = {
  e: "top-0 right-0 h-full w-1.5 cursor-ew-resize",
  s: "bottom-0 left-0 h-1.5 w-full cursor-ns-resize",
  se: "right-0 bottom-0 h-3 w-3 cursor-nwse-resize",
};

interface ResizeStart {
  handle: HandleId;
  x: number;
  y: number;
  size: Size;
  /** Cuántos píxeles de pantalla mide un píxel del lienzo (el zoom de la página). */
  scale: number;
}

interface SectionResizeHandlesProps {
  size: Size;
  /** Recibe solo el eje que cambia; quien lo guarda lo limita al máximo y a lo que ocupan los elementos. */
  onResize: (size: Partial<Size>) => void;
}

const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

/** Bordes arrastrables para agrandar o reducir un lienzo; avisan cuando se llega al máximo de pantalla. */
export function SectionResizeHandles({ size, onResize }: SectionResizeHandlesProps) {
  const start = useRef<ResizeStart | null>(null);
  const [active, setActive] = useState(false);

  const onPointerDown = (e: PointerEvent<HTMLElement>, handle: HandleId) => {
    e.stopPropagation();
    const canvas = e.currentTarget.parentElement!;
    const scale = canvas.getBoundingClientRect().width / canvas.offsetWidth || 1;
    start.current = { handle, x: e.clientX, y: e.clientY, size, scale };
    setActive(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const from = start.current;
    if (!from) return;

    const { sides } = HANDLES[from.handle];
    onResize({
      ...(sides.right ? { width: snapToGrid(from.size.width + (e.clientX - from.x) / from.scale) } : {}),
      ...(sides.bottom ? { height: snapToGrid(from.size.height + (e.clientY - from.y) / from.scale) } : {}),
    });
  };

  const end = () => {
    start.current = null;
    setActive(false);
  };

  const atLimit = size.width >= MAX_CANVAS_WIDTH || size.height >= MAX_CANVAS_HEIGHT;

  return (
    <>
      {(Object.entries(EDGE_HANDLES) as [HandleId, string][]).map(([handle, className]) => (
        <span
          key={handle}
          aria-label="Cambiar el tamaño del lienzo"
          onPointerDown={(e) => onPointerDown(e, handle)}
          onPointerMove={onPointerMove}
          onPointerUp={end}
          onPointerCancel={end}
          className={`absolute z-10 touch-none bg-accent/20 hover:bg-accent/50 ${className}`}
        />
      ))}

      {active && (
        <span className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded bg-black/80 px-2 py-1 text-[11px] whitespace-nowrap text-white">
          {size.width} × {size.height}
          {atLimit && ` · máximo de pantalla (${MAX_CANVAS_WIDTH} × ${MAX_CANVAS_HEIGHT})`}
        </span>
      )}
    </>
  );
}
