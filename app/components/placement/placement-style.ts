import type { CSSProperties } from "react";
import type { Placement } from "./types";

/**
 * El estilo de un elemento en posición libre; sin colocación no añade nada y el elemento sigue en el flujo.
 * Con `sized`, también fija el ancho (el titular y los medios; las tarjetas miden lo que miden sus elementos).
 */
export function placementStyle(placement: Placement | undefined, sized = false): CSSProperties | undefined {
  if (!placement) return undefined;
  return {
    position: placement.fixed ? "fixed" : "absolute",
    left: placement.x,
    top: placement.y,
    ...(placement.fixed ? { zIndex: 40 } : {}),
    ...(sized ? { width: placement.width } : {}),
  };
}

/** Atributos que identifican al elemento en el DOM: arrastrable, y colocado si lo está. */
export const placementAttributes = (placement: Placement | undefined) => ({
  "data-placeable": "",
  ...(placement ? { "data-placed": "" } : {}),
});
