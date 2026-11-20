import type { BlockInstance } from "./types";

/**
 * Un bloque nuevo entra justo debajo del seleccionado, para construir de arriba abajo sin reordenar a mano.
 * Sin selección en la página, o si es de otra zona (encabezado, pie), va al final como siempre.
 */
export function insertAfterSelected(blocks: BlockInstance[], block: BlockInstance, selectedId: string | null | undefined): BlockInstance[] {
  const index = blocks.findIndex((b) => b.id === selectedId);
  if (index === -1 || blocks[index].slot !== block.slot) return [...blocks, block];
  return [...blocks.slice(0, index + 1), block, ...blocks.slice(index + 1)];
}
