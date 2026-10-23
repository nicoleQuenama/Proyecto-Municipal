import type { AdaptiveDevice } from "./devices";

/** Posición y tamaño de un elemento dentro de su sección. */
export interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** El diseño propio de una sección en un dispositivo: lo define la persona, no se calcula. */
export interface DeviceLayout {
  size: { width: number; height: number };
  /** Por id de elemento; los que faltan conservan el marco del diseño base. */
  frames: Record<string, Frame>;
}

/** Un dispositivo sin entrada se adapta solo (modo automático). */
export type ResponsiveLayouts = Partial<Record<AdaptiveDevice, DeviceLayout>>;
