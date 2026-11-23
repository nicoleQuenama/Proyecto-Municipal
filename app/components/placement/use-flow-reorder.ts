"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { dropTarget } from "./drop-target";
import { PAGE_SELECTOR } from "./page-geometry";

/** Píxeles de pantalla que hay que arrastrar antes de que un clic cuente como arrastre. */
const THRESHOLD = 4;

interface FlowReorderOptions {
  enabled: boolean;
  blockId: string;
  /** Soltado: la sección cae antes de `beforeId`, o al final si es `null`. */
  onReorder: (beforeId: string | null) => void;
}

/** Las secciones en flujo de la página (no las flotantes) menos la que se arrastra, con su posición en pantalla. */
function flowSiblings(page: HTMLElement, dragged: string) {
  return [...page.querySelectorAll<HTMLElement>("[data-block-id]")]
    .filter((el) => el.dataset.blockId !== dragged && !el.parentElement?.closest("[data-block-id]"))
    .filter((el) => getComputedStyle(el).position !== "absolute" && getComputedStyle(el).position !== "fixed")
    .map((el) => ({ id: el.dataset.blockId!, ...(({ top, bottom }) => ({ top, bottom }))(el.getBoundingClientRect()) }));
}

/**
 * ¿Reordenar es lo que tiene sentido al arrastrarla? Solo si la sección ocupa el ancho de la página (no hay hacia dónde
 * moverla de lado) y hay otras en flujo. Una pieza más angosta se mueve libremente: de lado, arriba o abajo.
 */
export function reordersOnDrag(from: HTMLElement, dragged: string): boolean {
  const page = from.closest<HTMLElement>(PAGE_SELECTOR);
  if (!page) return true;
  const slack = page.getBoundingClientRect().width - from.getBoundingClientRect().width;
  return slack < 24 && flowSiblings(page, dragged).length > 0;
}

/**
 * Arrastrar una sección que sigue el flujo de la página: se reordena entre las demás, con una línea guía que marca
 * dónde va a caer. Es lo que se espera de «mover una sección»: no flota encima de otras.
 */
export function useFlowReorder({ enabled, blockId, onReorder }: FlowReorderOptions) {
  const latest = useRef({ onReorder });
  latest.current = { onReorder };

  const startDrag = (e: ReactPointerEvent<HTMLElement>) => {
    const page = e.currentTarget.closest<HTMLElement>(PAGE_SELECTOR);
    if (!enabled || !page) return;
    e.preventDefault();
    e.stopPropagation();

    const start = { x: e.clientX, y: e.clientY };
    let moved = false;
    let target: ReturnType<typeof dropTarget> | null = null;
    let line: HTMLDivElement | null = null;

    const showLine = (y: number) => {
      const frame = page.getBoundingClientRect();
      if (!line) {
        line = document.createElement("div");
        line.setAttribute("aria-hidden", "true");
        line.style.cssText = "position:fixed;height:3px;border-radius:2px;background:#0d99ff;box-shadow:0 0 0 2px rgba(13,153,255,.25);pointer-events:none;z-index:60";
        document.body.appendChild(line);
      }
      line.style.left = `${frame.left}px`;
      line.style.width = `${frame.width}px`;
      line.style.top = `${y - 1.5}px`;
    };

    const onMove = (event: PointerEvent) => {
      if (!moved && Math.hypot(event.clientX - start.x, event.clientY - start.y) < THRESHOLD) return;
      moved = true;
      document.body.style.cursor = "grabbing";
      target = dropTarget(flowSiblings(page, blockId), event.clientY);
      showLine(target.lineY);
    };

    const finish = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      document.body.style.cursor = "";
      line?.remove();
      if (moved && target) latest.current.onReorder(target.beforeId);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  };

  return { startDrag };
}
