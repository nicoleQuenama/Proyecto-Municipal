import { updateBlock } from "../site/overrides";
import type { SiteState } from "../site/types";
import type { AdaptiveDevice } from "./devices";
import { patchFrame, patchSize } from "./manual-layout";
import type { DeviceLayout, Frame } from "./types";

/** Cambia el diseño propio de un dispositivo; `null` vuelve al modo automático. */
function setLayout(state: SiteState, pageId: string, blockId: string, device: AdaptiveDevice, layout: DeviceLayout | null) {
  return updateBlock(state, pageId, blockId, (block) => {
    const rest = { ...block.responsive };
    if (layout) rest[device] = layout;
    else delete rest[device];
    return { ...block, responsive: Object.keys(rest).length > 0 ? rest : undefined };
  });
}

/** Aplica un cambio al diseño propio; si el dispositivo está en automático, no hay nada que cambiar. */
function editLayout(
  state: SiteState,
  at: { pageId: string; blockId: string; device: AdaptiveDevice },
  edit: (layout: DeviceLayout) => DeviceLayout,
): SiteState {
  const block = state.pages.find((p) => p.id === at.pageId)?.blocks.find((b) => b.id === at.blockId);
  const layout = block?.responsive?.[at.device];
  return layout ? setLayout(state, at.pageId, at.blockId, at.device, edit(layout)) : state;
}

export type ResponsiveAction =
  | { type: "responsive/set"; pageId: string; blockId: string; device: AdaptiveDevice; layout: DeviceLayout | null }
  | { type: "responsive/frame"; pageId: string; blockId: string; device: AdaptiveDevice; elementId: string; frame: Partial<Frame> }
  | { type: "responsive/size"; pageId: string; blockId: string; device: AdaptiveDevice; size: Partial<DeviceLayout["size"]>; backdropId?: string };

export const RESPONSIVE_HANDLERS: {
  [K in ResponsiveAction["type"]]: (state: SiteState, action: Extract<ResponsiveAction, { type: K }>) => SiteState;
} = {
  "responsive/set": (state, { pageId, blockId, device, layout }) => setLayout(state, pageId, blockId, device, layout),
  "responsive/frame": (state, { elementId, frame, ...at }) => editLayout(state, at, (l) => patchFrame(l, elementId, frame)),
  "responsive/size": (state, { size, backdropId, ...at }) => editLayout(state, at, (l) => patchSize(l, size, backdropId)),
};
