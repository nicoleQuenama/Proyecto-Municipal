export type Device = "desktop" | "tablet" | "mobile";

/** Los dispositivos que se adaptan: el escritorio es el diseño base y no tiene diseño propio. */
export type AdaptiveDevice = Exclude<Device, "desktop">;

export const DEVICE_WIDTH: Record<Device, number> = { desktop: 1024, tablet: 768, mobile: 390 };

/** Relleno de la página (px-10 a cada lado) y de la caja de un bloque: lo que no queda para el contenido. */
const PAGE_PADDING = 80;
const BLOCK_PADDING = 16;

export const isAdaptive = (device: Device): device is AdaptiveDevice => device !== "desktop";

/** El ancho que tiene una sección para dibujarse en ese dispositivo. */
export const availableWidth = (device: Device): number => DEVICE_WIDTH[device] - PAGE_PADDING - BLOCK_PADDING;
