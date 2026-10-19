"use client";

import { useEffect, type PointerEvent } from "react";
import { useSite, useSiteDispatch } from "./site-context";
import { TITLE_SELECTION } from "./types";

/** Lo que conserva la selección al pulsarlo: los bloques, el titular y los medios, y los controles. */
const KEEPS_SELECTION = "[data-block-id], [data-placeable], button, a, input, textarea, select, [role=menu], [role=dialog]";
/** Dónde Escape no deselecciona: está escribiendo o hay un cuadro abierto. */
const TYPING = "input, textarea, select, [contenteditable], [role=dialog]";

/**
 * Quitar la selección: pulsar fuera de los bloques (el fondo del lienzo o de la página) o Escape. Escape quita
 * primero el elemento seleccionado y, si ya no hay, el bloque.
 */
export function useDeselect() {
  const { selectedId, selectedElementId } = useSite();
  const dispatch = useSiteDispatch();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || (e.target as Element).closest?.(TYPING)) return;
      if (selectedElementId !== null) dispatch({ type: "element/select", id: null });
      else if (selectedId !== TITLE_SELECTION) dispatch({ type: "block/select", id: TITLE_SELECTION });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId, selectedElementId, dispatch]);

  return {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (!(e.target as Element).closest(KEEPS_SELECTION)) dispatch({ type: "block/select", id: TITLE_SELECTION });
    },
  };
}
