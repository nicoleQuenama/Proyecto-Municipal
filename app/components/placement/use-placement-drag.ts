"use client";

import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useCanvasSettings } from "../canvas-editing/settings-context";
import { itemAndPage, pageUnder } from "./page-geometry";
import { usePageGuidesSetter } from "./page-guides";
import { beginPlacementDrag, cornerAt, DRAG_THRESHOLD, planDragStep, settleDrag, type PlacementDrag } from "./placement-plan";
import type { Placement } from "./types";

/** Atributo (sin valor) que marca la página sobre la que se va a soltar; el CSS la resalta. */
const HOT_ATTRIBUTE = "data-drop-hot";

interface PlacementDragOptions {
  enabled: boolean;
  onPlace: (placement: Placement) => void;
  /** Soltado sobre otra página. Sin esto, el elemento se queda en la suya. */
  onTransfer?: (pageId: string, placement: Placement) => void;
}

/**
 * Mover un elemento de la página a cualquier punto de ella, con guías y cuadrícula, o llevarlo a otra página.
 * `startDrag` va en el `onPointerDown` de lo que se agarra (un asa, o el propio elemento); el elemento es el
 * ancestro marcado con `data-placeable`.
 */
export function usePlacementDrag({ enabled, onPlace, onTransfer }: PlacementDragOptions) {
  const { settings } = useCanvasSettings();
  const setGuides = usePageGuidesSetter();
  const [dragging, setDragging] = useState(false);
  const drag = useRef<PlacementDrag | null>(null);
  const hotPage = useRef<HTMLElement | null>(null);

  // Los oyentes de la ventana viven más que un dibujo: leen siempre lo último.
  const latest = useRef({ settings, onPlace, onTransfer, setGuides });
  useLayoutEffect(() => {
    latest.current = { settings, onPlace, onTransfer, setGuides };
  });

  const markHot = (page: HTMLElement | null) => {
    if (hotPage.current === page) return;
    hotPage.current?.removeAttribute(HOT_ATTRIBUTE);
    page?.setAttribute(HOT_ATTRIBUTE, "");
    hotPage.current = page;
  };

  const onMove = (e: PointerEvent) => {
    const current = drag.current;
    if (!current) return;

    if (!current.moved) {
      const corner = cornerAt(e, current, current.page);
      if (Math.hypot(corner.x - current.start.x, corner.y - current.start.y) * current.scale < DRAG_THRESHOLD) return;
      current.moved = true;
      setDragging(true);
    }

    const step = planDragStep(current, e, latest.current.settings);
    current.last = step.placement;
    latest.current.onPlace(step.placement);
    if (step.guides) latest.current.setGuides?.(step.guides);
    markHot(latest.current.onTransfer ? pageUnder(e, current.item) : null);
  };

  const finish = (e: PointerEvent) => {
    const current = drag.current;
    drag.current = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", finish);
    window.removeEventListener("pointercancel", finish);

    const { onPlace: place, onTransfer: transfer, setGuides: guides } = latest.current;
    markHot(null);
    guides?.({ x: [], y: [] });
    setDragging(false);
    if (!current?.moved) return;

    const outcome = settleDrag(current, e, transfer !== undefined);
    if (outcome.kind === "transfer") transfer?.(outcome.pageId, outcome.placement);
    else place(outcome.placement);
  };

  const startDrag = (e: ReactPointerEvent<HTMLElement>) => {
    const found = itemAndPage(e.currentTarget);
    if (!enabled || !found) return;
    e.preventDefault(); // sin selección de texto mientras se arrastra
    e.stopPropagation();

    drag.current = beginPlacementDrag(found.item, found.page, { x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  };

  return { startDrag, dragging };
}
