import { edgesIn, itemAndPage, scaleOf } from "./page-geometry";
import type { Placement } from "./types";

/**
 * Dónde está ahora, en la pantalla, un bloque de la página, como una colocación libre. Sirve para pasar un bloque
 * del flujo a «sobreponer» sin que salte: queda exactamente donde se ve. `null` si no está dibujado.
 */
export function currentPlacement(blockId: string): Placement | null {
  const element = document.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(blockId)}"][data-placeable]`);
  const found = element && itemAndPage(element);
  if (!found) return null;

  const edges = edgesIn(found.page, found.item, scaleOf(found.page));
  return { x: Math.max(0, Math.round(edges.left)), y: Math.max(0, Math.round(edges.top)), width: Math.round(edges.right - edges.left) };
}
