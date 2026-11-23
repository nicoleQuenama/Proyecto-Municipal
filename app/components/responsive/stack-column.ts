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

const isCardNode = (node: StackNode) =>
  node.children.length > 0 &&
  (node.el.id.includes("-card") ||
    node.el.id.includes("card-") ||
    (node.el.role === "container" && (node.el.id.includes("-c") || node.el.id.includes("card"))));

const getOptionKey = (node: StackNode): string | null => {
  const match = node.el.id.match(/opt\d+/);
  return match ? match[0] : null;
};

/** Pone los nodos uno bajo otro, a todo el ancho, en orden de lectura; devuelve el alto total. */
export function layoutColumn(nodes: StackNode[], x: number, y: number, width: number, out: Map<string, Frame>): number {
  const byEl = new Map(nodes.map((n) => [n.el, n]));
  let cursor = y;
  let previous: CanvasElement | undefined;

  const cardRoots = nodes.filter((n) => isCardNode(n));

  // Si no hay tarjetas contenedoras, mantener el comportamiento clásico directo
  if (cardRoots.length === 0) {
    for (const el of stackOrder(nodes.map((n) => n.el))) {
      const node = byEl.get(el)!;
      if (node.children.length === 0 && FIT[el.kind](el, width).height === 0) {
        out.set(el.id, { x, y: cursor, width: 0, height: 0 });
        continue;
      }
      if (previous) cursor += gapBetween(previous, el);
      cursor += place(node, x, cursor, width, out);
      previous = el;
    }
    return cursor - y;
  }

  // Hay tarjetas: separamos los elementos anteriores, el grupo de tarjetas y los posteriores
  const minCardY = Math.min(...cardRoots.map((c) => c.el.y));
  const maxCardY = Math.max(...cardRoots.map((c) => c.el.y + c.el.height));

  const beforeNodes = nodes.filter((n) => !isCardNode(n) && n.el.y < minCardY + 10);
  const afterNodes = nodes.filter((n) => !isCardNode(n) && n.el.y >= maxCardY - 10);

  // 1. Elementos previos a las tarjetas
  for (const el of stackOrder(beforeNodes.map((n) => n.el))) {
    const node = byEl.get(el)!;
    if (node.children.length === 0 && FIT[el.kind](el, width).height === 0) {
      out.set(el.id, { x, y: cursor, width: 0, height: 0 });
      continue;
    }
    if (previous) cursor += gapBetween(previous, el);
    cursor += place(node, x, cursor, width, out);
    previous = el;
  }

  // 2. Tarjetas: 3 columnas en PC (>=960px), 2 columnas en tablet y móvil (<960px)
  if (previous) cursor += GAP.fallback;
  const cardsStartY = cursor;

  const cardCols = width >= 960 ? 3 : 2;
  const cardGap = width < 480 ? 8 : 16;
  const cardWidth = Math.max(120, Math.floor((width - (cardCols - 1) * cardGap) / cardCols));

  // Agrupar tarjetas por opción (opt1, opt2, opt3...) o grupo por defecto
  const optionGroups = new Map<string, StackNode[]>();
  for (const card of cardRoots) {
    const key = getOptionKey(card) ?? "default";
    const list = optionGroups.get(key) ?? [];
    list.push(card);
    optionGroups.set(key, list);
  }

  let maxOptionHeight = 0;
  for (const [, groupCards] of optionGroups) {
    groupCards.sort((a, b) => (Math.abs(a.el.y - b.el.y) > 10 ? a.el.y - b.el.y : a.el.x - b.el.x));
    let optCursor = cardsStartY;

    for (let c = 0; c < groupCards.length; c += cardCols) {
      const row = groupCards.slice(c, c + cardCols);
      const rowHeights: number[] = [];
      for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const cardNode = row[colIdx];
        const cardX = x + colIdx * (cardWidth + cardGap);
        const h = place(cardNode, cardX, optCursor, cardWidth, out);
        rowHeights.push(h);
      }
      const maxH = Math.max(...rowHeights);
      for (const cardNode of row) {
        const frame = out.get(cardNode.el.id);
        if (frame) out.set(cardNode.el.id, { ...frame, height: maxH });
      }
      optCursor += maxH;
      if (c + cardCols < groupCards.length) optCursor += cardGap;
    }
    maxOptionHeight = Math.max(maxOptionHeight, optCursor - cardsStartY);
  }

  cursor = cardsStartY + maxOptionHeight;
  previous = cardRoots[cardRoots.length - 1].el;

  // 3. Elementos posteriores a las tarjetas
  for (const el of stackOrder(afterNodes.map((n) => n.el))) {
    const node = byEl.get(el)!;
    if (node.children.length === 0 && FIT[el.kind](el, width).height === 0) {
      out.set(el.id, { x, y: cursor, width: 0, height: 0 });
      continue;
    }
    if (previous) cursor += gapBetween(previous, el);
    cursor += place(node, x, cursor, width, out);
    previous = el;
  }

  return cursor - y;
}
