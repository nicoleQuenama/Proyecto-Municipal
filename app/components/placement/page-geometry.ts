import type { Edges } from "../canvas-editing/edges";

/** Los elementos de una página que se pueden mover (bloques, titular, medios) y la página que los contiene. */
export const ITEM_SELECTOR = "[data-placeable]";
export const PAGE_SELECTOR = "[data-site-page]";

/** Píxeles de pantalla por píxel de la página: el zoom del lienzo. */
export const scaleOf = (page: HTMLElement) => page.getBoundingClientRect().width / page.offsetWidth || 1;

/**
 * El punto de la pantalla donde empieza el interior de la página, dentro de su borde: lo absoluto (`left`, `top`) se
 * cuenta desde ahí, no desde el borde exterior. Con el borde de edición (que crece al alejar el zoom) medir desde fuera corría todo.
 */
const originOf = (page: HTMLElement, scale: number) => {
  const box = page.getBoundingClientRect();
  return { left: box.left + page.clientLeft * scale, top: box.top + page.clientTop * scale };
};

/** Lo que mide la página por dentro del borde: donde cabe lo colocado. */
export const innerSize = (page: HTMLElement) => ({ width: page.clientWidth, height: page.clientHeight });

/** Los bordes de un elemento, en píxeles de la página. */
export function edgesIn(page: HTMLElement, el: HTMLElement, scale: number): Edges {
  const origin = originOf(page, scale);
  const r = el.getBoundingClientRect();
  return {
    left: (r.left - origin.left) / scale,
    top: (r.top - origin.top) / scale,
    right: (r.right - origin.left) / scale,
    bottom: (r.bottom - origin.top) / scale,
  };
}

/** La esquina de un elemento agarrado por `grab` si el puntero está en `pointer`, en píxeles de la página. */
export function cornerOf(page: HTMLElement, pointer: { clientX: number; clientY: number }, grab: { x: number; y: number }, scale: number) {
  const origin = originOf(page, scale);
  return { x: (pointer.clientX - origin.left) / scale - grab.x, y: (pointer.clientY - origin.top) / scale - grab.y };
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
