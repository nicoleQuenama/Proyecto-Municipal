import type { BlockInstance } from "../site/types";
import { isAdaptive, type Device } from "./devices";
import type { FoldConfig, FoldKind } from "./types";

/** El punto de partida de cada presentación al elegirla. Una nueva es una entrada nueva. */
export const FOLD_DEFAULTS: Record<FoldKind, FoldConfig> = {
  carousel: { kind: "carousel", cardWidth: 85, dots: true, arrows: true },
  more: { kind: "more", maxHeight: 320, moreLabel: "Ver más", lessLabel: "Ver menos" },
  accordion: { kind: "accordion", open: false },
};

/** Lo mínimo y lo máximo que se puede ajustar. */
export const FOLD_LIMITS = { cardWidth: { min: 40, max: 100 }, maxHeight: { min: 120, max: 1200 } };

/** La presentación de una sección en un dispositivo (el escritorio nunca tiene). */
export const foldOf = (block: BlockInstance, device: Device): FoldConfig | undefined =>
  isAdaptive(device) ? block.fold?.[device] : undefined;

/** ¿Se recorta? Solo si la sección es más alta que el límite. */
export const isTrimmed = (height: number, maxHeight: number): boolean => height > maxHeight;

/** Una página del carrusel: la tarjeta más cerca del borde izquierdo según lo desplazado. */
export function activeCard(scrollLeft: number, step: number, count: number): number {
  if (step <= 0 || count <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.round(scrollLeft / step)));
}

/** El ancho de cada tarjeta del carrusel, en px, según el ancho disponible y el % elegido. */
export const cardPixels = (available: number, cardWidth: number): number => Math.max(1, Math.round((available * cardWidth) / 100));
