"use client";

import { useLayoutEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { useCanvasSettings } from "../canvas-editing/settings-context";
import { GRID_SIZE } from "../canvas-editing/snapping";
import { edgesIn, itemAndPage, scaleOf } from "./page-geometry";
import type { Placement } from "./types";

export type WidthSide = "left" | "right";

/** Lo más angosto que puede quedar un elemento al redimensionarlo. */
const MIN_WIDTH = 80;

interface WidthResizeOptions {
  enabled: boolean;
  onPlace: (placement: Placement) => void;
}

/**
 * Cambiar el ancho de un elemento de la página (una imagen, un video, el titular) arrastrando un lado o una
 * esquina. El alto sigue al ancho, así que la proporción no se deforma. Un elemento en el flujo queda colocado
 * donde está al empezar.
 */
export function useWidthResize({ enabled, onPlace }: WidthResizeOptions) {
  const { settings } = useCanvasSettings();

  // Los oyentes de la ventana viven más que un dibujo: leen siempre lo último.
  const latest = useRef({ settings, onPlace });
  useLayoutEffect(() => {
    latest.current = { settings, onPlace };
  });

  const startResize = (e: ReactPointerEvent<HTMLElement>, side: WidthSide) => {
    const found = itemAndPage(e.currentTarget);
    if (!enabled || !found) return;
    const { item, page } = found;
    e.preventDefault();
    e.stopPropagation();

    const scale = scaleOf(page);
    const start = edgesIn(page, item, scale);
    const startX = e.clientX;

    const onMove = (ev: PointerEvent) => {
      const { settings: s, onPlace: place } = latest.current;
      const snap = (value: number) => (s.snap && !ev.ctrlKey ? Math.round(value / GRID_SIZE) * GRID_SIZE : value);
      const dx = (ev.clientX - startX) / scale;

      const left = side === "left" ? Math.max(0, Math.min(start.right - MIN_WIDTH, snap(start.left + dx))) : start.left;
      const right = side === "right" ? Math.min(page.offsetWidth, Math.max(start.left + MIN_WIDTH, snap(start.right + dx))) : start.right;
      place({ x: Math.round(left), y: Math.round(start.top), width: Math.round(right - left) });
    };
    const onEnd = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  };

  return { startResize };
}
