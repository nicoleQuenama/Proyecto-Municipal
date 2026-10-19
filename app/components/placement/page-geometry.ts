import type { Edges } from "../canvas-editing/edges";

/** Los elementos de una página que se pueden mover (bloques, titular, medios) y la página que los contiene. */
export const ITEM_SELECTOR = "[data-placeable]";
export const PAGE_SELECTOR = "[data-site-page]";

/** Píxeles de pantalla por píxel de la página: el zoom del lienzo. */
export const scaleOf = (page: HTMLElement) => page.getBoundingClientRect().width / page.offsetWidth || 1;

/** Los bordes de un elemento, en píxeles de la página. */
export function edgesIn(page: HTMLElement, el: HTMLElement, scale: number): Edges {
  const p = page.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return {
    left: (r.left - p.left) / scale,
    top: (r.top - p.top) / scale,
    right: (r.right - p.left) / scale,
    bottom: (r.bottom - p.top) / scale,
  };
}

/** La página que hay bajo el puntero, sin contar la que ocupa lo que se arrastra. */
export function pageUnder(e: PointerEvent, item: HTMLElement): HTMLElement | null {
  const hit = document.elementsFromPoint(e.clientX, e.clientY).find((el) => !item.contains(el) && el.closest(PAGE_SELECTOR));
  return hit?.closest<HTMLElement>(PAGE_SELECTOR) ?? null;
}

/** El elemento movible que contiene a `el` y la página donde está; `null` si no está en ninguna. */
export function itemAndPage(el: Element): { item: HTMLElement; page: HTMLElement } | null {
  const item = el.closest<HTMLElement>(ITEM_SELECTOR);
  const page = item?.closest<HTMLElement>(PAGE_SELECTOR);
  return item && page ? { item, page } : null;
}
