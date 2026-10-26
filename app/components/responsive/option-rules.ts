import { mergePatch, updateBlock } from "../site/overrides";
import type { BlockInstance, SiteState } from "../site/types";
import { chooseStrategy } from "./adapt-rules";
import type { Suggestion } from "./adapt-suggest";
import type { AdaptiveDevice } from "./devices";
import { defaultMenu } from "./menu-model";
import type { FoldChoices, FoldConfig, MenuConfig } from "./types";

/** Cambia (o quita, con `null`) la presentación de una sección en un dispositivo. */
function withFold(block: BlockInstance, device: AdaptiveDevice, fold: FoldConfig | null): BlockInstance {
  const rest: FoldChoices = { ...block.fold };
  delete rest[device];
  const next = fold ? { ...rest, [device]: fold } : rest;
  return { ...block, fold: Object.keys(next).length > 0 ? next : undefined };
}

export type OptionAction =
  | { type: "responsive/menu"; pageId: string; blockId: string; patch: Partial<MenuConfig> }
  | { type: "responsive/fold"; pageId: string; blockId: string; device: AdaptiveDevice; fold: FoldConfig | null }
  | { type: "responsive/suggest"; pageId: string; device: AdaptiveDevice; changes: Suggestion[] };

export const OPTION_HANDLERS: {
  [K in OptionAction["type"]]: (state: SiteState, action: Extract<OptionAction, { type: K }>) => SiteState;
} = {
  // El menú parte del que se propone solo y guarda únicamente lo que la persona cambia.
  "responsive/menu": (state, { pageId, blockId, patch }) =>
    updateBlock(state, pageId, blockId, (block) => {
      const def = state.components.find((c) => c.id === block.componentId);
      const current = block.menu ?? (def ? defaultMenu(def) : undefined);
      return current ? { ...block, menu: mergePatch(current, patch) } : block;
    }),

  "responsive/fold": (state, { pageId, blockId, device, fold }) =>
    updateBlock(state, pageId, blockId, (block) => withFold(block, device, fold)),

  // Aplica de una vez las sugerencias del asistente.
  "responsive/suggest": (state, { pageId, device, changes }) =>
    changes.reduce(
      (next, change) =>
        updateBlock(next, pageId, change.blockId, (block) => {
          const adapted = change.strategy ? chooseStrategy(block, device, change.strategy) : block;
          return change.fold ? withFold(adapted, device, change.fold) : adapted;
        }),
      state,
    ),
};
