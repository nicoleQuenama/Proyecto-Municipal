import type { CanvasElement } from "../site/types";
import { stackOrder } from "./stack-order";
import { FIT } from "./stack-sizes";
import type { StackNode } from "./stack-tree";
import type { Frame } from "./types";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Espacio entre dos elementos seguidos: el que tenían originalmente, entre 8 y 32 px. */
const GAP = { min: 8, max: 32, fallback: 16 };
const PANEL_PADDING_MAX = 24;

const gapBetween = (prev: CanvasElement, next: CanvasElement) => {
  const original = next.y - (prev.y + prev.height);
  return original > 0 ? clamp(original, GAP.min, GAP.max) : GAP.fallback;
};

/** El relleno de un panel: lo que separaba a sus contenidos de su borde. */
function panelPadding(node: StackNode) {
  const left = Math.min(...node.children.map((c) => c.el.x)) - node.el.x;
  const top = Math.min(...node.children.map((c) => c.el.y)) - node.el.y;
  return { x: clamp(left, 0, PANEL_PADDING_MAX), y: clamp(top, 0, PANEL_PADDING_MAX) };
}

/** Coloca un nodo (y lo que lleva dentro) en la columna; devuelve el alto que ocupa. */
function place(node: StackNode, x: number, y: number, width: number, out: Map<string, Frame>): number {
  if (node.children.length === 0) {
    const fit = FIT[node.el.kind](node.el, width);
    out.set(node.el.id, { x: x + Math.round((width - fit.width) / 2), y, ...fit });
    return fit.height;
  }
  const pad = panelPadding(node);
  const inner = layoutColumn(node.children, x + pad.x, y + pad.y, width - 2 * pad.x, out);
  const height = inner + 2 * pad.y;
  out.set(node.el.id, { x, y, width, height });
  return height;
}

/** Pone los nodos uno bajo otro, a todo el ancho, en orden de lectura; devuelve el alto total. */
export function layoutColumn(nodes: StackNode[], x: number, y: number, width: number, out: Map<string, Frame>): number {
  const byEl = new Map(nodes.map((n) => [n.el, n]));
  let cursor = y;
  let previous: CanvasElement | undefined;

  for (const el of stackOrder(nodes.map((n) => n.el))) {
    if (previous) cursor += gapBetween(previous, el);
    cursor += place(byEl.get(el)!, x, cursor, width, out);
    previous = el;
  }
  return cursor - y;
}
