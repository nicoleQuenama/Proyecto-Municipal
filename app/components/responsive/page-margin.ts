import type { Device } from "./devices";

/** Margen a cada lado de la página según el dispositivo (px). El escritorio conserva el de siempre. */
export const DEFAULT_SIDE_MARGIN: Record<Device, number> = { desktop: 40, tablet: 32, mobile: 16 };

export const MARGIN_LIMITS = { min: 0, max: 80 };

/** Margen lateral propio de una página por dispositivo (también en escritorio); el que falta usa el de la tabla. */
export type SideMargins = Partial<Record<Device, number>>;

export const sideMargin = (device: Device, custom?: SideMargins): number =>
  custom?.[device] ?? DEFAULT_SIDE_MARGIN[device];
