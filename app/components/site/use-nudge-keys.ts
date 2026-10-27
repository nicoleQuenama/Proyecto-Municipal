"use client";

import { useEffect } from "react";
import type { CanvasElement, ElementOverride } from "./types";
import { useNavigation } from "../navigation/navigation-context";
import { useSite } from "./site-context";

/** Dónde las flechas no mueven: está escribiendo o hay un cuadro abierto. */
const TYPING = "input, textarea, select, [contenteditable], [role=dialog]";

/** Hacia dónde empuja cada flecha. */
const DIRECTIONS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** Las flechas mueven 1 px los elementos seleccionados del bloque (Shift: 10 px). */
export function useNudgeKeys(
  selected: boolean,
  elements: CanvasElement[],
  change: (elementId: string, patch: ElementOverride) => void,
) {
  const { selectedElementId, alsoSelectedIds } = useSite();
  const { mode } = useNavigation();

  useEffect(() => {
    if (!selected || mode !== "edit" || !selectedElementId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const direction = DIRECTIONS[e.key];
      if (!direction || (e.target as Element).closest?.(TYPING)) return;
      const step = e.shiftKey ? 10 : 1;
      const ids = new Set([selectedElementId, ...(alsoSelectedIds ?? [])]);
      const moving = elements.filter((element) => ids.has(element.id));
      if (moving.length === 0) return;
      e.preventDefault();
      for (const element of moving) {
        change(element.id, {
          x: Math.max(0, element.x + direction[0] * step),
          y: Math.max(0, element.y + direction[1] * step),
          parentId: null,
          slot: undefined,
          offset: undefined,
          fitToParent: undefined,
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
}
