import type { BlockInstance } from "../site/types";

export type Add = (key: string, node: string, property: string, value: string) => void;

/** Huella corta de un valor, para detectar que cambió sin guardarlo entero. */
export const hashOf = (value: unknown): string => {
  let hash = 5381;
  for (const char of JSON.stringify(value)) hash = ((hash * 33) ^ char.charCodeAt(0)) >>> 0;
  return hash.toString(36).slice(0, 5);
};

/** El diseño propio de cada dispositivo de una sección (tablet y móvil definidos a mano). */
export function addResponsive(add: Add, node: string, block: BlockInstance) {
  for (const [device, layout] of Object.entries(block.responsive ?? {})) {
    add(`responsive:${block.id}:${device}`, node, `Diseño para ${device === "mobile" ? "móvil" : "tablet"}`, hashOf(layout));
  }
}
