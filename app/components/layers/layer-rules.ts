import type { EditScope } from "../canvas-editing/settings-context";
import { updateBlock } from "../site/overrides";
import type { SiteState } from "../site/types";
import { sortByOrder } from "./layer-order";

export type LayerAction =
  /** Reordena las capas de un componente (de atrás hacia delante), solo en este bloque o en todo el componente. */
  { type: "layer/order"; scope: EditScope; componentId: string; pageId: string; blockId: string; ids: string[] };

type Order = Extract<LayerAction, { type: "layer/order" }>;

/** Cómo se guarda el orden según el alcance. Un alcance nuevo es una entrada nueva. */
const BY_SCOPE: Record<EditScope, (state: SiteState, action: Order) => SiteState> = {
  block: (state, { pageId, blockId, ids }) => updateBlock(state, pageId, blockId, (block) => ({ ...block, order: ids })),

  // Vale para todos los bloques: el orden propio que tuvieran se quita.
  component: (state, { componentId, ids }) => ({
    ...state,
    components: state.components.map((def) => (def.id === componentId ? { ...def, elements: sortByOrder(def.elements, ids) } : def)),
    pages: state.pages.map((page) => ({
      ...page,
      blocks: page.blocks.map((block) => (block.componentId === componentId ? { ...block, order: undefined } : block)),
    })),
  }),
};

type Handlers = { [K in LayerAction["type"]]: (state: SiteState, action: Extract<LayerAction, { type: K }>) => SiteState };

export const LAYER_HANDLERS: Handlers = {
  "layer/order": (state, action) => BY_SCOPE[action.scope](state, action),
};
