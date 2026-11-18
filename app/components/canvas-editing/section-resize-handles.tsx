"use client";

import { useRef, useState, type PointerEvent } from "react";
import { MAX_CANVAS_HEIGHT, MAX_CANVAS_WIDTH, type ResizeAnchor, type Size } from "./limits";
import { HANDLES, type HandleId } from "./resize-handles";
import { GRID_SIZE } from "./snapping";

/**
 * Las ocho manijas de una sección, dibujadas dentro de la caja (la página recorta lo que sobresale), como las
 * de un cuadrado: cuatro bordes y cuatro esquinas. Las esquinas van al final para quedar encima de los bordes.
 */
const BOX_HANDLES: Record<HandleId, string> = {
  n: "top-0 left-0 right-0 h-1.5 cursor-ns-resize",
  e: "top-0 bottom-0 right-0 w-1.5 cursor-ew-resize",
  s: "bottom-0 left-0 right-0 h-1.5 cursor-ns-resize",
  w: "top-0 bottom-0 left-0 w-1.5 cursor-ew-resize",
  nw: "top-0 left-0 h-3 w-3 cursor-nwse-resize",
  ne: "top-0 right-0 h-3 w-3 cursor-nesw-resize",
  sw: "bottom-0 left-0 h-3 w-3 cursor-nesw-resize",
  se: "bottom-0 right-0 h-3 w-3 cursor-nwse-resize",
};

const HANDLE_ORDER: HandleId[] = ["n", "e", "s", "w", "nw", "ne", "sw", "se"];

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
  onResize: (size: Partial<Size>, anchor: ResizeAnchor) => void;
  /** El ancho lo decide la página (flujo, barra de navegación o pie): faltan las manijas laterales y no se toca. */
  widthLocked?: boolean;
}

const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

/** Bordes arrastrables para agrandar o reducir una sección; avisan cuando se llega al máximo de pantalla. */
export function SectionResizeHandles({ size, onResize, widthLocked = false }: SectionResizeHandlesProps) {
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
    const horizontal = sides.right
      ? { width: snapToGrid(from.size.width + (e.clientX - from.x) / from.scale) }
      : sides.left
        ? { width: snapToGrid(from.size.width - (e.clientX - from.x) / from.scale) }
        : {};
    const vertical = sides.bottom
      ? { height: snapToGrid(from.size.height + (e.clientY - from.y) / from.scale) }
      : sides.top
        ? { height: snapToGrid(from.size.height - (e.clientY - from.y) / from.scale) }
        : {};
    // Sin ancho propio solo cambia la altura: las manijas laterales ni siquiera se dibujan.
    const next = { ...(widthLocked ? {} : horizontal), ...vertical };
    // Con el lado izquierdo o el de arriba agarrado, quien guarda mueve también la posición: el lado contrario se queda.
    if (next.width !== undefined || next.height !== undefined) onResize(next, { left: sides.left, top: sides.top });
  };

  const end = () => {
    start.current = null;
    setActive(false);
  };

  const atLimit = size.width >= MAX_CANVAS_WIDTH || size.height >= MAX_CANVAS_HEIGHT;
  const shown = widthLocked ? HANDLE_ORDER.filter((handle) => handle !== "e" && handle !== "w") : HANDLE_ORDER;

  return (
    <>
      {shown.map((handle) => (
        <span
          key={handle}
          aria-label="Cambiar el tamaño de la sección"
          onPointerDown={(e) => onPointerDown(e, handle)}
          onPointerMove={onPointerMove}
          onPointerUp={end}
          onPointerCancel={end}
          className={`absolute z-10 touch-none bg-accent/20 hover:bg-accent/50 ${BOX_HANDLES[handle]}`}
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
