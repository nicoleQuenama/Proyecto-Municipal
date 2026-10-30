import { mergePatch, styleElements, updateBlock } from "../site/overrides";
import type { BlockInstance, Page, SiteState } from "../site/types";
import type { AdaptiveDevice, Device } from "./devices";
import { toggleHiddenOn } from "./hidden-on";
import { MARGIN_LIMITS } from "./page-margin";
import type { AutoStrategy } from "./types";

/** Quita la entrada de un dispositivo; un registro vacío se guarda como «sin nada». */
function withoutDevice<T>(record: Partial<Record<Device, T>> | undefined, device: Device) {
  const rest = { ...record };
  delete rest[device];
  return Object.keys(rest).length > 0 ? rest : undefined;
}

const updatePage = (state: SiteState, pageId: string, update: (page: Page) => Page): SiteState => ({
  ...state,
  pages: state.pages.map((page) => (page.id === pageId ? update(page) : page)),
});

/** Elige cómo se adapta solo una sección (`null` = la inteligente); deja de ser un diseño a mano. */
export function chooseStrategy(block: BlockInstance, device: Device, strategy: AutoStrategy | null): BlockInstance {
  const adapt = withoutDevice(block.adapt, device);
  return {
    ...block,
    responsive: withoutDevice(block.responsive, device as AdaptiveDevice),
    adapt: strategy ? { ...adapt, [device]: strategy } : adapt,
  };
}

export type AdaptAction =
  | { type: "responsive/adapt"; pageId: string; blockId: string; device: Device; strategy: AutoStrategy | null }
  | { type: "responsive/adapt-page"; pageId: string; device: AdaptiveDevice; includeManual: boolean }
  | { type: "responsive/hide"; pageId: string; blockId: string; elementId?: string; device: Device; hidden: boolean }
  | { type: "responsive/margin"; pageId: string; device: AdaptiveDevice; margin: number | null };

export const ADAPT_HANDLERS: {
  [K in AdaptAction["type"]]: (state: SiteState, action: Extract<AdaptAction, { type: K }>) => SiteState;
} = {
  "responsive/adapt": (state, { pageId, blockId, device, strategy }) =>
    updateBlock(state, pageId, blockId, (block) => chooseStrategy(block, device, strategy)),

  // Todas las secciones vuelven a la estrategia inteligente; los diseños a mano solo si se pide.
  "responsive/adapt-page": (state, { pageId, device, includeManual }) =>
    updatePage(state, pageId, (page) => ({
      ...page,
      blocks: page.blocks.map((block) =>
        block.responsive?.[device] && !includeManual ? block : chooseStrategy(block, device, null),
      ),
    })),

  "responsive/hide": (state, { pageId, blockId, elementId, device, hidden }) => {
    if (!elementId) {
      return updateBlock(state, pageId, blockId, (block) => ({ ...block, hiddenOn: toggleHiddenOn(block.hiddenOn, device, hidden) }));
    }
    const block = state.pages.find((p) => p.id === pageId)?.blocks.find((b) => b.id === blockId);
    const hiddenOn = toggleHiddenOn(block?.elements?.[elementId]?.hiddenOn, device, hidden);
    return styleElements(state, pageId, blockId, [elementId], { hiddenOn });
  },

  "responsive/margin": (state, { pageId, device, margin }) =>
    updatePage(state, pageId, (page) => {
      const clamped = margin === null ? undefined : Math.min(MARGIN_LIMITS.max, Math.max(MARGIN_LIMITS.min, margin));
      return { ...page, sideMargin: mergePatch(page.sideMargin, { [device]: clamped }) };
    }),
};
