/** Dónde poner un menú junto a su botón, en coordenadas de la ventana (lógica pura). */

import type { CSSProperties } from "react";

export type Side = "top" | "bottom" | "bottom-start" | "bottom-end";

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const GAP = 8;
const EDGE = 8;

/** Cada lado: cómo se colocan los bordes del menú respecto al botón. */
const PLACERS: Record<Side, (box: Box, view: { width: number; height: number }) => CSSProperties> = {
  top: (box, view) => ({
    left: (box.left + box.right) / 2,
    transform: "translateX(-50%)",
    bottom: view.height - box.top + GAP + 4,
    maxHeight: Math.max(120, box.top - GAP - EDGE),
  }),
  bottom: (box, view) => ({
    left: (box.left + box.right) / 2,
    transform: "translateX(-50%)",
    top: box.bottom + GAP,
    maxHeight: Math.max(120, view.height - box.bottom - GAP - EDGE),
  }),
  "bottom-start": (box, view) => ({
    left: Math.max(EDGE, box.left),
    top: box.bottom + GAP / 2,
    maxHeight: Math.max(120, view.height - box.bottom - EDGE),
  }),
  "bottom-end": (box, view) => ({
    right: Math.max(EDGE, view.width - box.right),
    top: box.bottom + GAP,
    maxHeight: Math.max(120, view.height - box.bottom - GAP - EDGE),
  }),
};

export const placeBeside = (box: Box, side: Side, view: { width: number; height: number }): CSSProperties =>
  PLACERS[side](box, view);
