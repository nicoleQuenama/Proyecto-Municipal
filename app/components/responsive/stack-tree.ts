import type { CanvasElement } from "../site/types";

/** Un elemento y lo que va dentro de él (si es un panel). */
export interface StackNode {
  el: CanvasElement;
  children: StackNode[];
}

/** Cuánto de un elemento debe caer dentro de otro para decir que está «encima». */
const INSIDE = 0.9;

const area = (e: CanvasElement) => e.width * e.height;

function inside(inner: CanvasElement, outer: CanvasElement): boolean {
  const w = Math.min(inner.x + inner.width, outer.x + outer.width) - Math.max(inner.x, outer.x);
  const h = Math.min(inner.y + inner.height, outer.y + outer.height) - Math.max(inner.y, outer.y);
  return w > 0 && h > 0 && (w * h) / area(inner) >= INSIDE;
}

/** Un panel es un rectángulo sin texto propio, más grande que lo que tiene encima. */
const isPanel = (e: CanvasElement) => e.kind === "rect" && e.text.trim() === "";

/** Agrupa cada elemento dentro del panel más pequeño que lo contiene; el resto queda al primer nivel. */
export function buildTree(elements: CanvasElement[]): StackNode[] {
  const nodes = new Map(elements.map((el) => [el.id, { el, children: [] as StackNode[] }]));
  const roots: StackNode[] = [];

  for (const el of elements) {
    const parent = elements
      .filter((p) => p !== el && isPanel(p) && area(p) > area(el) && inside(el, p))
      .sort((a, b) => area(a) - area(b))[0];
    (parent ? nodes.get(parent.id)!.children : roots).push(nodes.get(el.id)!);
  }
  return roots;
}
