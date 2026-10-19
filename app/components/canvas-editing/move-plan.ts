import type { CanvasElement } from "../site/types";
import { dropTargetAt } from "./containers";
import { dockedPosition, snappedSlot, type Point } from "./dock-slots";
import type { DropState } from "./gesture-types";
import type { Size } from "./limits";
import type { Edges } from "./edges";

export interface MovePlan {
  /** Dónde queda la esquina del elemento, dentro del lienzo. */
  corner: Point;
  /** El contenedor sobre el que cae, si hay uno. */
  drop: DropState | null;
}

interface MoveInput {
  elements: CanvasElement[];
  id: string;
  /** Dónde quedaría el elemento (ya con el imán de guías y cuadrícula). */
  edges: Edges;
  /** Dónde está el puntero, en coordenadas del lienzo. */
  pointer: Point;
  size: Size;
  /** Falso con Alt: el elemento se queda suelto aunque caiga sobre un contenedor. */
  allowDock: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Qué pasa al mover un elemento: dentro de un contenedor se pega a una casilla si queda cerca; si no, se queda
 * donde esté. En cualquier caso no sale del lienzo.
 */
export function planMove({ elements, id, edges, pointer, size, allowDock }: MoveInput): MovePlan {
  const box = { width: edges.right - edges.left, height: edges.bottom - edges.top };
  let at: Point = { x: edges.left, y: edges.top };

  const parent = allowDock ? dropTargetAt(elements, id, pointer) : null;
  const slot = parent ? snappedSlot(parent, box, at) : null;
  if (parent && slot) at = dockedPosition(parent, box, slot);

  return {
    corner: {
      x: Math.round(clamp(at.x, 0, Math.max(0, size.width - box.width))),
      y: Math.round(clamp(at.y, 0, Math.max(0, size.height - box.height))),
    },
    drop: parent && { parent, slot },
  };
}
