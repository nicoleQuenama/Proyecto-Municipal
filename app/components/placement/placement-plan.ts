/**
 * Qué pasa al arrastrar un elemento de la página: dónde queda mientras se arrastra (con guías y cuadrícula) y
 * dónde se queda al soltarlo. Lee medidas del DOM, pero no cambia nada: el hook es quien aplica el resultado.
 */

import { edgesIn, ITEM_SELECTOR, pageUnder, scaleOf } from "./page-geometry";
import { ALL_SIDES, type Edges } from "../canvas-editing/edges";
import { snapEdges, type Guides } from "../canvas-editing/snapping";
import type { CanvasSettings } from "../canvas-editing/settings-context";
import type { Placement } from "./types";

/** Píxeles de pantalla que hay que arrastrar antes de que un clic cuente como movimiento. */
export const DRAG_THRESHOLD = 3;

export interface PlacementDrag {
  item: HTMLElement;
  page: HTMLElement;
  /** Píxeles de pantalla por píxel de la página (el zoom del lienzo). */
  scale: number;
  /** Dónde agarró el elemento, desde su esquina. */
  grab: { x: number; y: number };
  size: { width: number; height: number };
  start: { x: number; y: number };
  moved: boolean;
  /** Dónde quedó en el último movimiento. */
  last: Placement;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Mide el elemento y la página para empezar a arrastrar. */
export function beginPlacementDrag(item: HTMLElement, page: HTMLElement, pointer: { x: number; y: number }): PlacementDrag {
  const scale = scaleOf(page);
  const box = item.getBoundingClientRect();
  const edges = edgesIn(page, item, scale);
  const size = { width: box.width / scale, height: box.height / scale };

  return {
    item,
    page,
    scale,
    grab: { x: (pointer.x - box.left) / scale, y: (pointer.y - box.top) / scale },
    size,
    start: { x: edges.left, y: edges.top },
    moved: false,
    last: { x: edges.left, y: edges.top, width: size.width },
  };
}

/** La esquina del elemento si el puntero está en `e`, en píxeles de `page`. */
export function cornerAt(e: PointerEvent, drag: PlacementDrag, page: HTMLElement) {
  const box = page.getBoundingClientRect();
  return { x: (e.clientX - box.left) / drag.scale - drag.grab.x, y: (e.clientY - box.top) / drag.scale - drag.grab.y };
}

/** Los bordes de la página y de los demás elementos de ella, a los que el arrastre puede pegarse. */
function snapReferences(drag: PlacementDrag): Edges[] {
  const others = [...drag.page.querySelectorAll<HTMLElement>(ITEM_SELECTOR)].filter(
    (el) => el !== drag.item && !drag.item.contains(el),
  );
  return [
    { left: 0, top: 0, right: drag.page.offsetWidth, bottom: drag.page.offsetHeight },
    ...others.map((el) => edgesIn(drag.page, el, drag.scale)),
  ];
}

export interface DragStep {
  placement: Placement;
  guides: Guides | null;
}

/** Dónde queda el elemento mientras se arrastra, pegado a las guías y a la cuadrícula si el imán está activo. */
export function planDragStep(drag: PlacementDrag, e: PointerEvent, settings: CanvasSettings): DragStep {
  const corner = cornerAt(e, drag, drag.page);
  const edges: Edges = {
    left: corner.x,
    top: corner.y,
    right: corner.x + drag.size.width,
    bottom: corner.y + drag.size.height,
  };

  const snapped =
    settings.snap && !e.ctrlKey
      ? snapEdges({ edges, sides: ALL_SIDES, references: snapReferences(drag), grid: settings.grid })
      : null;
  const final = snapped?.edges ?? edges;

  return {
    placement: { x: Math.round(final.left), y: Math.round(final.top), width: Math.round(drag.size.width) },
    guides: snapped?.guides ?? null,
  };
}

export type DragOutcome =
  | { kind: "transfer"; pageId: string; placement: Placement }
  | { kind: "place"; placement: Placement };

/**
 * Dónde se queda el elemento al soltarlo: en otra página (si se soltó sobre una y se puede), o en la suya, sin salir
 * de ella por los lados ni por arriba.
 */
export function settleDrag(drag: PlacementDrag, e: PointerEvent, canTransfer: boolean): DragOutcome {
  const target = pageUnder(e, drag.item);
  const pageId = target?.closest<HTMLElement>("[data-page-id]")?.dataset.pageId;

  if (canTransfer && target && target !== drag.page && pageId) {
    const corner = cornerAt(e, drag, target);
    return {
      kind: "transfer",
      pageId,
      placement: { x: Math.max(0, Math.round(corner.x)), y: Math.max(0, Math.round(corner.y)), width: drag.last.width },
    };
  }

  return {
    kind: "place",
    placement: {
      x: clamp(drag.last.x, 0, Math.max(0, drag.page.offsetWidth - drag.size.width)),
      y: Math.max(0, drag.last.y),
      width: drag.last.width,
    },
  };
}
