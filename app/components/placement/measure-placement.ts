import { edgesIn, itemAndPage, scaleOf } from "./page-geometry";
import type { Placement } from "./types";

/**
 * Dónde está ahora un elemento en su página, como una posición guardable (descontando su margen, que `left`/`top`
 * no incluyen). Sirve para pasar a «colocado» algo que seguía el flujo, sin que se mueva de donde se ve.
 */
export function measurePlacement(el: HTMLElement): Placement | null {
  const found = itemAndPage(el);
  if (!found) return null;
  const scale = scaleOf(found.page);
  const edges = edgesIn(found.page, found.item, scale);
  const style = getComputedStyle(found.item);
  return {
    x: Math.max(0, Math.round(edges.left - (parseFloat(style.marginLeft) || 0))),
    y: Math.max(0, Math.round(edges.top - (parseFloat(style.marginTop) || 0))),
    width: Math.round(edges.right - edges.left),
  };
}
