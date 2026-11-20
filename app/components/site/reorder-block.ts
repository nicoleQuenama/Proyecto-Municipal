import type { BlockInstance } from "./types";

/**
 * Pone una sección (o varias, conservando su orden entre sí) justo antes de otra (`beforeId`), o al final si es
 * `null`. Es lo que pasa al arrastrar secciones en flujo: caen donde se ve la línea guía, no flotando encima.
 */
export function reorderBlock(blocks: BlockInstance[], blockIds: string | string[], beforeId: string | null): BlockInstance[] {
  const ids = new Set(Array.isArray(blockIds) ? blockIds : [blockIds]);
  const moving = blocks.filter((b) => ids.has(b.id));
  if (moving.length === 0 || (beforeId !== null && ids.has(beforeId))) return blocks;
  const rest = blocks.filter((b) => !ids.has(b.id));
  const at = beforeId === null ? -1 : rest.findIndex((b) => b.id === beforeId);
  const next = at === -1 ? [...rest, ...moving] : [...rest.slice(0, at), ...moving, ...rest.slice(at)];
  return next.every((b, i) => b === blocks[i]) ? blocks : next;
}

type Slot = NonNullable<BlockInstance["slot"]>;

/**
 * Soltar una sección en un lugar de la página: se ordena ahí y adopta la zona (encabezado, cuerpo o pie) de la
 * sección junto a la que cae. Sin esto, soltar el aviso sobre un encabezado cambiaba el orden de la lista pero no lo
 * que se ve: el encabezado se pinta siempre arriba.
 */
export function dropBlocks(blocks: BlockInstance[], blockIds: string[], beforeId: string | null, slotOf: (block: BlockInstance) => Slot): BlockInstance[] {
  const ids = new Set(blockIds);
  const reordered = reorderBlock(blocks, blockIds, beforeId);
  const anchor = beforeId === null ? [...blocks].reverse().find((b) => !ids.has(b.id)) : blocks.find((b) => b.id === beforeId);
  if (!anchor) return reordered;

  const slot = slotOf(anchor);
  const adopted = reordered.map((b) => (ids.has(b.id) && slotOf(b) !== slot ? { ...b, slot } : b));
  return adopted.every((b, i) => b === blocks[i]) ? blocks : adopted;
}
