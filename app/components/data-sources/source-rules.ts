import { updateBlock } from "../site/overrides";
import type { SiteState } from "../site/types";
import type { DataRef, DataSource } from "./types";

export type SourceAction =
  | { type: "source/save"; source: DataSource }
  | { type: "source/remove"; id: string }
  | { type: "binding/set"; pageId: string; blockId: string; elementId: string; ref: DataRef | null }
  | { type: "binding/many"; pageId: string; blockId: string; refs: Record<string, DataRef> }
  | { type: "repeat/set"; pageId: string; blockId: string; ref: DataRef | null };

type Handlers = { [K in SourceAction["type"]]: (state: SiteState, action: Extract<SourceAction, { type: K }>) => SiteState };

const without = <T,>(record: Record<string, T> | undefined, key: string): Record<string, T> | undefined => {
  const rest = Object.fromEntries(Object.entries(record ?? {}).filter(([k]) => k !== key));
  return Object.keys(rest).length > 0 ? rest : undefined;
};

/** Lo que cambia cada acción de las fuentes de datos. */
export const SOURCE_HANDLERS: Handlers = {
  "source/save": (state, { source }) => ({
    ...state,
    sources: state.sources.some((s) => s.id === source.id)
      ? state.sources.map((s) => (s.id === source.id ? source : s))
      : [...state.sources, source],
  }),

  // Quitar una fuente suelta también los enlaces que la usaban.
  "source/remove": (state, { id }) => ({
    ...state,
    sources: state.sources.filter((s) => s.id !== id),
    pages: state.pages.map((page) => ({
      ...page,
      blocks: page.blocks.map((block) => ({
        ...block,
        repeat: block.repeat?.sourceId === id ? undefined : block.repeat,
        bindings: Object.fromEntries(Object.entries(block.bindings ?? {}).filter(([, ref]) => ref.sourceId !== id)),
      })),
    })),
  }),

  "binding/set": (state, { pageId, blockId, elementId, ref }) =>
    updateBlock(state, pageId, blockId, (block) => ({
      ...block,
      bindings: ref ? { ...block.bindings, [elementId]: ref } : without(block.bindings, elementId),
    })),

  "binding/many": (state, { pageId, blockId, refs }) =>
    updateBlock(state, pageId, blockId, (block) => ({ ...block, bindings: { ...block.bindings, ...refs } })),

  "repeat/set": (state, { pageId, blockId, ref }) =>
    updateBlock(state, pageId, blockId, (block) => ({ ...block, repeat: ref ?? undefined })),
};
