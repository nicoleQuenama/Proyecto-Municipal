import type { Size } from "../canvas-editing/limits";
import type { ElementOverride, SiteAction } from "../site/types";
import type { AdaptiveDevice } from "./devices";
import type { Frame } from "./types";

export interface DeviceTarget {
  pageId: string;
  blockId: string;
  device: AdaptiveDevice;
}

const FRAME_KEYS: (keyof Frame)[] = ["x", "y", "width", "height"];

/** De un cambio de formato, solo lo que es posición o tamaño: un diseño por dispositivo no guarda más. */
function frameOf(patch: ElementOverride): Partial<Frame> {
  const frame: Partial<Frame> = {};
  for (const key of FRAME_KEYS) if (patch[key] !== undefined) frame[key] = patch[key];
  return frame;
}

/** Mover o redimensionar un elemento en el diseño propio de un dispositivo. */
export const deviceFrameChange = (at: DeviceTarget, elementId: string, patch: ElementOverride): SiteAction => ({
  type: "responsive/frame",
  ...at,
  elementId,
  frame: frameOf(patch),
});

/** Redimensionar la sección en el diseño propio de un dispositivo. */
export const deviceSizeChange = (at: DeviceTarget, size: Partial<Size>, backdropId?: string): SiteAction => ({
  type: "responsive/size",
  ...at,
  size,
  backdropId,
});
