"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useNavigation } from "../navigation/navigation-context";
import { PAGE_SELECTOR, scaleOf } from "../placement/page-geometry";
import { useSiteDispatch } from "../site/site-context";
import { useViewport } from "../viewport/viewport-context";
import { backgroundAt } from "./background-under";
import { frameFromDrag, type DrawFrame, type Point } from "./draw-plan";
import { ShapePreview } from "./shape-preview";
import { SHAPE_TOOLS, type ShapeSpec } from "./shape-tools";
import { textColorOn } from "./text-color";

interface Gesture {
  spec: ShapeSpec;
  pageId: string;
  page: HTMLElement;
  scale: number;
  start: Point;
}

/** La página crece con su contenido: se puede dibujar hasta aquí por debajo de su borde para agregar secciones nuevas. */
const GROW_BELOW = 1200;

/** Dónde está el puntero dentro de la página, en píxeles de la página (sin el zoom del lienzo). */
const pointOn = (e: { clientX: number; clientY: number }, page: HTMLElement, scale: number): Point => {
  const box = page.getBoundingClientRect();
  return { x: (e.clientX - box.left) / scale, y: (e.clientY - box.top) / scale };
};

/** La página (y su id) que hay bajo el puntero. */
function pageAt(e: { clientX: number; clientY: number }): { page: HTMLElement; pageId: string } | null {
  const page = document.elementsFromPoint(e.clientX, e.clientY).find((el) => el.matches(PAGE_SELECTOR));
  const pageId = page?.closest<HTMLElement>("[data-page-id]")?.dataset.pageId;
  return page instanceof HTMLElement && pageId ? { page, pageId } : null;
}

/**
 * Dibujar figuras sobre una página: con una herramienta de figura elegida, arrastrar crea una sección «Forma»
 * colocada donde se dibujó. Mayús mantiene la proporción 1:1; Esc cancela. Al soltar vuelve la herramienta Mover.
 */
export function useShapeDrawing() {
  const { tool, setTool } = useViewport();
  const { mode } = useNavigation();
  const dispatch = useSiteDispatch();
  const [preview, setPreview] = useState<ReactNode>(null);
  const cancel = useRef<(() => void) | null>(null);

  const spec = mode === "edit" ? SHAPE_TOOLS[tool] : undefined;

  // Cambiar de herramienta a medio trazo lo cancela.
  useEffect(() => () => cancel.current?.(), [tool]);

  const onPointerDownCapture = (e: ReactPointerEvent<HTMLElement>) => {
    const target = pageAt(e);
    if (!spec || e.button !== 0 || !target) return;
    e.preventDefault();
    e.stopPropagation(); // ni la selección de un bloque ni «deseleccionar» deben reaccionar

    const { page, pageId } = target;
    // Un texto nuevo toma la tinta que mejor se lee sobre el fondo donde se empieza a dibujar (antes de que aparezca la vista previa).
    const overrides = spec.kind === "text" || spec.kind === "icon" ? { ...spec.overrides, color: textColorOn(backgroundAt(e.clientX, e.clientY)) } : spec.overrides;
    const gesture: Gesture = { spec, pageId, page, scale: scaleOf(page), start: pointOn(e, page, scaleOf(page)) };

    const frameAt = (event: PointerEvent): DrawFrame =>
      frameFromDrag({
        kind: spec.kind,
        start: gesture.start,
        end: pointOn(event, page, gesture.scale),
        constrain: event.shiftKey,
        bounds: { width: page.offsetWidth, height: page.offsetHeight + GROW_BELOW },
      });

    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("keydown", key);
      cancel.current = null;
      setPreview(null);
    };
    const move = (event: PointerEvent) => {
      const frame = frameAt(event);
      const box = page.getBoundingClientRect();
      setPreview(<ShapePreview kind={spec.kind} frame={frame} origin={box} scale={gesture.scale} />);
    };
    const up = (event: PointerEvent) => {
      const frame = frameAt(event);
      stop();
      dispatch({
        type: "shape/draw",
        pageId,
        blockId: crypto.randomUUID(),
        componentId: crypto.randomUUID(),
        kind: spec.kind,
        label: spec.label,
        overrides,
        frame,
      });
      setTool("select");
    };
    const key = (event: KeyboardEvent) => event.key === "Escape" && stop();

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("keydown", key);
    cancel.current = stop;
  };

  return { onPointerDownCapture, preview };
}
