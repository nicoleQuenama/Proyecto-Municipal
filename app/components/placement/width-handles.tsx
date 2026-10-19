"use client";

import type { PointerEvent } from "react";
import type { WidthSide } from "./use-width-resize";

/** Las seis manijas de ancho de un elemento: cuatro esquinas y dos lados. Van dentro, porque el elemento recorta lo que sobresale. */
const HANDLES: Record<string, { side: WidthSide; className: string }> = {
  nw: { side: "left", className: "top-1 left-1 cursor-nwse-resize" },
  ne: { side: "right", className: "top-1 right-1 cursor-nesw-resize" },
  sw: { side: "left", className: "bottom-1 left-1 cursor-nesw-resize" },
  se: { side: "right", className: "right-1 bottom-1 cursor-nwse-resize" },
  w: { side: "left", className: "top-1/2 left-1 -translate-y-1/2 cursor-ew-resize" },
  e: { side: "right", className: "top-1/2 right-1 -translate-y-1/2 cursor-ew-resize" },
};

interface WidthHandlesProps {
  onStart: (e: PointerEvent<HTMLElement>, side: WidthSide) => void;
}

/** Manijas para cambiar el ancho de un elemento (aparecen al pasar el ratón por encima; el contenedor es `group`). */
export function WidthHandles({ onStart }: WidthHandlesProps) {
  return Object.entries(HANDLES).map(([id, { side, className }]) => (
    <span
      key={id}
      aria-label="Cambiar tamaño"
      onPointerDown={(e) => onStart(e, side)}
      className={`absolute z-30 hidden h-2.5 w-2.5 touch-none border-2 border-sky-500 bg-white group-hover:block ${className}`}
    />
  ));
}
