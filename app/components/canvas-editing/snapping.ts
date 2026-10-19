/**
 * Imán del lienzo: al mover o redimensionar, los bordes y el centro se pegan a las guías (bordes y centros de
 * los demás elementos y del lienzo) y, si no hay ninguna cerca, a la cuadrícula.
 */

import type { Edges, Sides } from "./edges";

export const GRID_SIZE = 8;
/** A cuántos píxeles de una guía el elemento se le pega. */
export const SNAP_THRESHOLD = 6;

/** Posiciones del lienzo donde se dibujan las líneas guía activas. */
export interface Guides {
  x: number[];
  y: number[];
}

export interface SnapResult {
  edges: Edges;
  guides: Guides;
}

type Axis = "x" | "y";

/** Las posiciones a las que se puede pegar un eje: bordes y centro de cada referencia. */
const targetsOf = (references: Edges[], axis: Axis): number[] =>
  references.flatMap((r) => {
    const [start, end] = axis === "x" ? [r.left, r.right] : [r.top, r.bottom];
    return [start, (start + end) / 2, end];
  });

/** Los puntos del elemento que se pegan: los bordes que se mueven y, si se mueve entero, su centro. */
function anchorsOf(edges: Edges, sides: Sides, axis: Axis): number[] {
  const [start, end, movesStart, movesEnd] =
    axis === "x" ? [edges.left, edges.right, sides.left, sides.right] : [edges.top, edges.bottom, sides.top, sides.bottom];
  return [...(movesStart ? [start] : []), ...(movesStart && movesEnd ? [(start + end) / 2] : []), ...(movesEnd ? [end] : [])];
}

/** El desplazamiento más corto que alinea algún ancla con algún objetivo, o null si ninguno está cerca. */
function nearestOffset(anchors: number[], targets: number[]): { offset: number; target: number } | null {
  let best: { offset: number; target: number } | null = null;
  for (const anchor of anchors) {
    for (const target of targets) {
      const offset = target - anchor;
      if (Math.abs(offset) <= SNAP_THRESHOLD && (!best || Math.abs(offset) < Math.abs(best.offset))) {
        best = { offset, target };
      }
    }
  }
  return best;
}

/** Lo que cambia en un eje: cuánto se corrige y qué guía se enciende (si hay). */
interface AxisSnap {
  offset: number;
  guide: number | null;
}

const NO_SNAP: AxisSnap = { offset: 0, guide: null };

function snapAxis(anchors: number[], targets: number[], useGrid: boolean): AxisSnap {
  if (anchors.length === 0) return NO_SNAP;

  const guide = nearestOffset(anchors, targets);
  if (guide) return { offset: guide.offset, guide: guide.target };
  if (!useGrid) return NO_SNAP;

  // Sin guías cerca: el primer ancla (el borde que se mueve) cae en la línea de cuadrícula más próxima.
  const [first] = anchors;
  return { offset: Math.round(first / GRID_SIZE) * GRID_SIZE - first, guide: null };
}

interface SnapOptions {
  edges: Edges;
  sides: Sides;
  /** Bordes de los elementos y del lienzo a los que se puede pegar. */
  references: Edges[];
  grid: boolean;
}

/** Pega los bordes que se mueven a la guía o línea de cuadrícula más cercana. */
export function snapEdges({ edges, sides, references, grid }: SnapOptions): SnapResult {
  const x = snapAxis(anchorsOf(edges, sides, "x"), targetsOf(references, "x"), grid);
  const y = snapAxis(anchorsOf(edges, sides, "y"), targetsOf(references, "y"), grid);

  return {
    edges: {
      left: sides.left ? edges.left + x.offset : edges.left,
      right: sides.right ? edges.right + x.offset : edges.right,
      top: sides.top ? edges.top + y.offset : edges.top,
      bottom: sides.bottom ? edges.bottom + y.offset : edges.bottom,
    },
    guides: {
      x: x.guide === null ? [] : [x.guide],
      y: y.guide === null ? [] : [y.guide],
    },
  };
}
