import { isAdaptive, type AdaptiveDevice, type Device } from "./devices";

/** Margen a cada lado de la página según el dispositivo (px). El escritorio conserva el de siempre. */
export const DEFAULT_SIDE_MARGIN: Record<Device, number> = { desktop: 40, tablet: 32, mobile: 16 };

export const MARGIN_LIMITS = { min: 0, max: 80 };

/** Margen lateral propio de una página por dispositivo; el que falta usa el de la tabla. */
export type SideMargins = Partial<Record<AdaptiveDevice, number>>;

export const sideMargin = (device: Device, custom?: SideMargins): number =>
  (isAdaptive(device) ? custom?.[device] : undefined) ?? DEFAULT_SIDE_MARGIN[device];
