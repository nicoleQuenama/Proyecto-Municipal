/** Rutas a un dato dentro de una respuesta: `articles[0].title`. Sin dependencias, para probarlas aparte. */

const SEGMENT = /([^.[\]]+)|\[(\d+)\]/g;

export function getPath(data: unknown, path: string): unknown {
  let current = data;
  for (const [, key, index] of path.matchAll(SEGMENT)) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key ?? index];
  }
  return current;
}

export const joinPath = (base: string, key: string | number): string =>
  typeof key === "number" ? `${base}[${key}]` : base ? `${base}.${key}` : key;

export interface PathNode {
  path: string;
  key: string;
  /** Texto corto del valor, o el tamaño de la lista/objeto. */
  preview: string;
  isList: boolean;
  children: PathNode[];
}

const MAX_ITEMS = 3;
const MAX_DEPTH = 6;

const preview = (value: unknown): string =>
  Array.isArray(value) ? `lista · ${value.length}` : value !== null && typeof value === "object" ? "objeto" : String(value).slice(0, 40);

/** El árbol de claves de una respuesta (de las listas enseña los primeros elementos). */
export function toTree(value: unknown, path = "", key = "respuesta", depth = 0): PathNode {
  const isList = Array.isArray(value);
  const entries: [string | number, unknown][] =
    value !== null && typeof value === "object" && depth < MAX_DEPTH
      ? isList
        ? value.slice(0, MAX_ITEMS).map((item, i) => [i, item])
        : Object.entries(value)
      : [];

  return {
    path,
    key,
    preview: preview(value),
    isList,
    children: entries.map(([k, v]) => toTree(v, joinPath(path, k), typeof k === "number" ? `[${k}]` : k, depth + 1)),
  };
}
