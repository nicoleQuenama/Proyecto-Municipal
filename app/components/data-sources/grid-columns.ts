import { availableWidth, BLOCK_PADDING, isAdaptive, type Device } from "../responsive/devices";
import type { RepeatLayout } from "./types";

export const COLUMN_LIMITS = { min: 1, max: 8 };

const clamp = (n: number) => Math.min(COLUMN_LIMITS.max, Math.max(COLUMN_LIMITS.min, Math.round(n)));

/** Cuántas copias de `copyWidth` px caben en `available` px (el ancho de una sección) con el espacio entre ellas. */
export const columnsThatFit = (available: number, copyWidth: number, gap: number): number =>
  clamp(Math.floor((available + gap + BLOCK_PADDING) / (copyWidth + gap + BLOCK_PADDING)));

/**
 * Las columnas de la rejilla en un dispositivo: las que la persona fijó para él o, si lo dejó vacío, las que
 * caben (sin pasar de las del escritorio). El escritorio usa siempre las suyas.
 */
export function columnsFor(layout: RepeatLayout, device: Device, copyWidth: number, margin?: number): number {
  if (!isAdaptive(device)) return clamp(layout.columns);
  const chosen = layout.columnsOn?.[device];
  if (chosen !== undefined) return clamp(chosen);
  return Math.min(clamp(layout.columns), columnsThatFit(availableWidth(device, margin), copyWidth, layout.gap));
}

/** El ancho para la sección de cada copia con ese número de columnas (descontando la caja de cada una). */
export const cellWidth = (available: number, columns: number, gap: number): number =>
  Math.max(1, Math.floor((available + BLOCK_PADDING - gap * (columns - 1)) / columns) - BLOCK_PADDING);
