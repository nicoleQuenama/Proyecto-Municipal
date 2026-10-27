/** Copiar y pegar secciones (Ctrl+C, Ctrl+V, Ctrl+D), una o varias a la vez. */

import { selectBlocks } from "./multi-select";
import type { BlockInstance, ComponentDef, SiteState } from "./types";

/** Lo que se copia de una sección: ella y, si es una figura o un texto dibujado, su propio componente (cada uno es único). */
export interface Clip {
  block: BlockInstance;
  component?: ComponentDef;
}

export type PasteAction = { type: "block/paste"; pageId: string; clips: Clip[]; blockIds: string[]; componentIds: string[] };

/** Cuánto se corre lo pegado, para que no quede justo encima de la original. */
export const PASTE_OFFSET = 24;

/** Una instantánea de las secciones (en el orden de la página): sigue valiendo aunque después se borren o se cambien. */
export function copyBlocks(state: SiteState, pageId: string, blockIds: string[]): Clip[] {
  const page = state.pages.find((p) => p.id === pageId);
  return (page?.blocks ?? [])
    .filter((block) => blockIds.includes(block.id))
    .map((block) => {
      const component = state.components.find((c) => c.id === block.componentId);
      return structuredClone({ block, ...(component?.drawn ? { component } : {}) });
    });
}

function pasteOne(state: SiteState, pageId: string, clip: Clip, blockId: string, componentId: string): SiteState {
  const shared = !clip.component;
  if (shared && !state.components.some((c) => c.id === clip.block.componentId)) return state;

  const copy = structuredClone(clip);
  const block: BlockInstance = {
    ...copy.block,
    id: blockId,
    componentId: shared ? copy.block.componentId : componentId,
    behaviors: copy.block.behaviors?.map((behavior) => ({ ...behavior, id: crypto.randomUUID() })),
    placement: copy.block.placement && {
      ...copy.block.placement,
      x: copy.block.placement.x + PASTE_OFFSET,
      y: copy.block.placement.y + PASTE_OFFSET,
    },
  };
  return {
    ...state,
    components: copy.component ? [...state.components, { ...copy.component, id: componentId }] : state.components,
    pages: state.pages.map((p) => (p.id === pageId ? { ...p, blocks: [...p.blocks, block] } : p)),
  };
}

/** Pega las secciones en una página y las deja seleccionadas: un componente dibujado se duplica, uno de la biblioteca se reutiliza. */
export function pasteBlocks(state: SiteState, pageId: string, clips: Clip[], blockIds: string[], componentIds: string[]): SiteState {
  if (!state.pages.some((p) => p.id === pageId)) return state;
  const next = clips.reduce((acc, clip, i) => pasteOne(acc, pageId, clip, blockIds[i], componentIds[i]), state);
  const page = next.pages.find((p) => p.id === pageId);
  const pasted = blockIds.filter((id) => page?.blocks.some((block) => block.id === id));
  return pasted.length > 0 ? { ...selectBlocks(next, pasted), currentPageId: pageId } : state;
}

type Handlers = { [K in PasteAction["type"]]: (state: SiteState, action: Extract<PasteAction, { type: K }>) => SiteState };

export const PASTE_HANDLERS: Handlers = {
  "block/paste": (state, action) => pasteBlocks(state, action.pageId, action.clips, action.blockIds, action.componentIds),
};
