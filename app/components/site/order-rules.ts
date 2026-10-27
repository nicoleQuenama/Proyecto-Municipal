/** El orden de las secciones colocadas en una página: lo que va después queda por encima (traer adelante, enviar atrás). */

import type { BlockInstance, SiteState } from "./types";

export type OrderMove = "front" | "back" | "forward" | "backward";

export type OrderAction = { type: "block/order"; pageId: string; blockIds: string[]; to: OrderMove };

/** Las etiquetas de cada movimiento. Uno nuevo es una entrada nueva aquí y en `MOVES`. */
export const ORDER_LABELS: Record<OrderMove, string> = {
  front: "Traer al frente",
  forward: "Subir una capa",
  backward: "Bajar una capa",
  back: "Enviar al fondo",
};

type Mover = (blocks: BlockInstance[], picked: Set<string>) => BlockInstance[];

const MOVES: Record<OrderMove, Mover> = {
  front: (blocks, picked) => [...blocks.filter((b) => !picked.has(b.id)), ...blocks.filter((b) => picked.has(b.id))],
  back: (blocks, picked) => [...blocks.filter((b) => picked.has(b.id)), ...blocks.filter((b) => !picked.has(b.id))],
  // Cada una pasa por delante de la siguiente que no esté también elegida; se recorre desde el lado al que van.
  forward: (blocks, picked) => {
    const next = [...blocks];
    for (let i = next.length - 2; i >= 0; i--) {
      if (picked.has(next[i].id) && !picked.has(next[i + 1].id)) [next[i], next[i + 1]] = [next[i + 1], next[i]];
    }
    return next;
  },
  backward: (blocks, picked) => {
    const next = [...blocks];
    for (let i = 1; i < next.length; i++) {
      if (picked.has(next[i].id) && !picked.has(next[i - 1].id)) [next[i], next[i - 1]] = [next[i - 1], next[i]];
    }
    return next;
  },
};

export function orderBlocks(state: SiteState, pageId: string, blockIds: string[], to: OrderMove): SiteState {
  const picked = new Set(blockIds);
  return {
    ...state,
    pages: state.pages.map((page) => (page.id === pageId ? { ...page, blocks: MOVES[to](page.blocks, picked) } : page)),
  };
}

type Handlers = { [K in OrderAction["type"]]: (state: SiteState, action: Extract<OrderAction, { type: K }>) => SiteState };

export const ORDER_HANDLERS: Handlers = {
  "block/order": (state, action) => orderBlocks(state, action.pageId, action.blockIds, action.to),
};
