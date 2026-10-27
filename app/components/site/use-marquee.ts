"use client";

import { useState, type PointerEvent as ReactPointerEvent } from "react";
import { useNavigation } from "../navigation/navigation-context";
import { useViewport } from "../viewport/viewport-context";
import { selectionOf } from "./multi-select";
import { useSite, useSiteDispatch } from "./site-context";

/** Lo que no inicia la marquesina al pulsarlo (sin Mayús): las secciones, el titular y los medios, y los controles. */
const KEEPS = "[data-block-id], [data-placeable], button, a, input, textarea, select, [role=menu], [role=dialog], [data-gradient-ui]";
/** Menos que esto es un clic, no un arrastre. */
const MIN_DRAG = 4;

/** Los elementos (no el fondo) de una sección que toca el rectángulo. */
export function elementsTouching(section: HTMLElement, box: MarqueeBox): string[] {
  return [...section.querySelectorAll<HTMLElement>("[data-el]:not([data-backdrop])")]
    .filter((el) => overlaps(el.getBoundingClientRect(), box))
    .map((el) => el.dataset.el!);
}

export interface MarqueeBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

const overlaps = (a: DOMRect, b: MarqueeBox) =>
  a.left < b.left + b.width && a.right > b.left && a.top < b.top + b.height && a.bottom > b.top;

/** Las secciones que toca el rectángulo, en cualquier página; devuelve las de la primera página que toca. */
export function blocksTouching(box: MarqueeBox): { pageId: string; ids: string[] } | null {
  const hits = [...document.querySelectorAll<HTMLElement>("[data-page-id] [data-block-id]")].filter((el) =>
    overlaps(el.getBoundingClientRect(), box),
  );
  const pageId = hits[0]?.closest<HTMLElement>("[data-page-id]")?.dataset.pageId;
  if (!pageId) return null;
  return { pageId, ids: hits.filter((el) => el.closest<HTMLElement>("[data-page-id]")?.dataset.pageId === pageId).map((el) => el.dataset.blockId!) };
}

/**
 * Seleccionar varias secciones como en Figma o Canva: arrastrar un rectángulo desde un punto vacío (o desde donde sea
 * con Mayús) selecciona todo lo que toca; Mayús+clic suma o quita una sección de la selección.
 */
export function useMarquee() {
  const { tool } = useViewport();
  const { mode } = useNavigation();
  const site = useSite();
  const dispatch = useSiteDispatch();
  const [box, setBox] = useState<MarqueeBox | null>(null);

  const begin = (e: ReactPointerEvent<HTMLElement>, additive = false) => {
    const target = e.target as Element;
    const start = { x: e.clientX, y: e.clientY };
    const pressed = target.closest<HTMLElement>("[data-block-id]");
    const pageId = target.closest<HTMLElement>("[data-page-id]")?.dataset.pageId ?? site.currentPageId;
    const boxTo = (x: number, y: number): MarqueeBox => ({
      left: Math.min(start.x, x),
      top: Math.min(start.y, y),
      width: Math.abs(x - start.x),
      height: Math.abs(y - start.y),
    });
    const move = (event: PointerEvent) => setBox(boxTo(event.clientX, event.clientY));
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setBox(null);
    };
    const up = (event: PointerEvent) => {
      const area = boxTo(event.clientX, event.clientY);
      stop();
      if (area.width < MIN_DRAG && area.height < MIN_DRAG) {
        // Un clic con Mayús sobre una sección la suma a la selección, o la quita si ya estaba.
        const id = pressed?.dataset.blockId;
        if (!id) return;
        const current = selectionOf(site);
        const ids = current.includes(id) ? current.filter((other) => other !== id) : [...current, id];
        dispatch({ type: "block/select-many", ids, pageId });
        return;
      }
      const hit = blocksTouching(area);
      // Con Ctrl se suma a lo que ya estaba seleccionado (en la misma página).
      const kept = additive && (!hit || hit.pageId === pageId) ? selectionOf(site) : [];
      dispatch({ type: "block/select-many", ids: [...new Set([...kept, ...(hit?.ids ?? [])])], pageId: hit?.pageId ?? pageId });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const active = mode === "edit" && tool === "select";

  /** Dentro de una sección ya seleccionada, arrastrar desde su fondo (o un punto vacío) elige los elementos que toca. */
  const beginInner = (e: ReactPointerEvent<HTMLElement>, section: HTMLElement, additive: boolean) => {
    const start = { x: e.clientX, y: e.clientY };
    const boxTo = (x: number, y: number): MarqueeBox => ({ left: Math.min(start.x, x), top: Math.min(start.y, y), width: Math.abs(x - start.x), height: Math.abs(y - start.y) });
    const move = (event: PointerEvent) => setBox(boxTo(event.clientX, event.clientY));
    const up = (event: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setBox(null);
      const area = boxTo(event.clientX, event.clientY);
      if (area.width < MIN_DRAG && area.height < MIN_DRAG) return;
      // Con Ctrl se suman a los elementos ya elegidos; sin él, reemplazan la selección.
      const had = additive ? [site.selectedElementId, ...(site.alsoSelectedIds ?? [])].filter((id): id is string => !!id) : [];
      const ids = elementsTouching(section, area).filter((id) => !had.includes(id));
      ids.forEach((id, index) => dispatch({ type: "element/select", id, add: had.length > 0 || index > 0 }));
      if (ids.length === 0 && !additive) dispatch({ type: "element/select", id: null });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return {
    box,
    /** Sin Mayús: solo desde un punto vacío (la página o el fondo del lienzo). */
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      if (!active || e.shiftKey || e.button !== 0 || (e.target as Element).closest(KEEPS)) return;
      begin(e, e.ctrlKey || e.metaKey);
    },
    /** Con Mayús: desde cualquier punto, también sobre una sección, sin que esta se arrastre. */
    onPointerDownCapture: (e: ReactPointerEvent<HTMLElement>) => {
      const target = e.target as Element;
      const section = target.closest<HTMLElement>("[data-block-id]");
      const pressedElement = target.closest<HTMLElement>("[data-el]");
      // Sección ya seleccionada: su fondo o un punto vacío arrastran un rectángulo de elementos, no la sección.
      if (
        active && !e.shiftKey && e.button === 0 && section && selectionOf(site).includes(section.dataset.blockId!) &&
        (!pressedElement || pressedElement.hasAttribute("data-backdrop")) && !target.closest("button, a, input, textarea, select, [role=menu], [role=dialog]")
      ) {
        e.preventDefault();
        e.stopPropagation();
        beginInner(e, section, e.ctrlKey || e.metaKey);
        return;
      }
      if (!active || !e.shiftKey || e.button !== 0 || (e.target as Element).closest("button, a, input, textarea, select, [role=menu], [role=dialog]")) return;
      e.preventDefault();
      e.stopPropagation();
      begin(e);
    },
  };
}
