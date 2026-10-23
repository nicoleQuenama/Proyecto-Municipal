import { getPath } from "./paths";
import type { DataRef } from "./types";

/**
 * Dentro de una sección repetida, la clave que se soltó (`articles[0].title`) vale para cada elemento de la lista:
 * se cambia el índice por el de la copia que se está dibujando.
 */
export function atIndex(ref: DataRef, repeat: DataRef | undefined, index: number | null): string {
  if (!repeat || index === null || repeat.sourceId !== ref.sourceId || !ref.path.startsWith(`${repeat.path}[`)) return ref.path;
  const rest = ref.path.slice(ref.path.indexOf("]", repeat.path.length) + 1);
  return `${repeat.path}[${index}]${rest}`;
}

export function resolveRef(data: unknown, ref: DataRef, repeat: DataRef | undefined, index: number | null): unknown {
  return getPath(data, atIndex(ref, repeat, index));
}

/** Cuántas copias saca una sección repetida (con un tope para no colgar la página). */
export const MAX_REPEAT = 50;

export function repeatCount(data: unknown, repeat: DataRef): number {
  const list = getPath(data, repeat.path);
  return Array.isArray(list) ? Math.min(list.length, MAX_REPEAT) : 0;
}
