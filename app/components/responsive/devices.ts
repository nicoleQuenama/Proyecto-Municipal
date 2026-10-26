export type Device = "desktop" | "tablet" | "mobile";

/** Los dispositivos que se adaptan: el escritorio es el diseño base y no tiene diseño propio. */
export type AdaptiveDevice = Exclude<Device, "desktop">;

export const DEVICE_WIDTH: Record<Device, number> = { desktop: 1024, tablet: 768, mobile: 390 };

/** Nombre en lenguaje llano: para etiquetas («Móvil · 390 px») y frases («Ocultar en móvil»). */
export const DEVICE_NAME: Record<Device, { title: string; plain: string }> = {
  desktop: { title: "Escritorio", plain: "escritorio" },
  tablet: { title: "Tablet", plain: "tablet" },
  mobile: { title: "Móvil", plain: "móvil" },
};

/** Margen de cada lado de la página por defecto (px) y relleno de la caja de un bloque. */
const DEFAULT_MARGIN = 40;
export const BLOCK_PADDING = 16;

export const isAdaptive = (device: Device): device is AdaptiveDevice => device !== "desktop";

/** El ancho que tiene una sección para dibujarse en ese dispositivo, dado el margen lateral de la página. */
export const availableWidth = (device: Device, margin: number = DEFAULT_MARGIN): number =>
  DEVICE_WIDTH[device] - 2 * margin - BLOCK_PADDING;
