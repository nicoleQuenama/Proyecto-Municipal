import type { SiteAction } from "../site/types";
import type { AdaptiveDevice } from "./devices";
import type { DeviceLayout, AdaptMode, AutoStrategy } from "./types";

interface PickContext {
  pageId: string;
  blockId: string;
  device: AdaptiveDevice;
  /** La estrategia que el CMS elegiría solo: elegirla otra vez vuelve al automático. */
  smart: AutoStrategy;
  /** El punto de partida de un diseño a mano: lo que se ve ahora. */
  seed: () => DeviceLayout;
}

/** El cambio que corresponde a la opción pulsada en el control de adaptación. */
export function pickAction(mode: AdaptMode, { pageId, blockId, device, smart, seed }: PickContext): SiteAction {
  if (mode === "manual") return { type: "responsive/set", pageId, blockId, device, layout: seed() };
  return { type: "responsive/adapt", pageId, blockId, device, strategy: mode === smart ? null : mode };
}
