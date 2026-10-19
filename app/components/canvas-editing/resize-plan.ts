import type { CanvasElement } from "../site/types";
import { isBackdrop } from "./backdrop";
import type { ResizeFrame } from "./gesture-types";
import { MAX_CANVAS_HEIGHT, MAX_CANVAS_WIDTH, MIN_ELEMENT_SIZE, type Size } from "./limits";
import { constrainResize, type Edges, type Sides } from "./edges";

interface ResizeInput {
  elements: CanvasElement[];
  id: string;
  edges: Edges;
  sides: Sides;
  size: Size;
  /** El fondo de la sección puede crecer más allá de ella (y la agranda). */
  backdropGrowsSection: boolean;
}

const MAX_SIZE: Size = { width: MAX_CANVAS_WIDTH, height: MAX_CANVAS_HEIGHT };

/**
 * La caja de un elemento al redimensionarlo: dentro del lienzo (o hasta el máximo, si es el fondo de una
 * sección que crece). Acoplado en posición libre, también cambia su desplazamiento respecto al contenedor.
 */
export function planResize({ elements, id, edges, sides, size, backdropGrowsSection }: ResizeInput): ResizeFrame {
  const element = elements.find((e) => e.id === id);
  const growsSection = backdropGrowsSection && element !== undefined && isBackdrop(element, size);
  const { left, top, right, bottom } = constrainResize(edges, sides, growsSection ? MAX_SIZE : size, MIN_ELEMENT_SIZE);

  const parent = element?.parentId === undefined ? undefined : elements.find((e) => e.id === element.parentId);
  const offset = parent && !element?.slot ? { x: left - parent.x, y: top - parent.y } : undefined;

  return { x: left, y: top, width: right - left, height: bottom - top, ...(offset ? { offset } : {}) };
}
