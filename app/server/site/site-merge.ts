import { deepEqual } from "./deep-equal.ts";

/** Lo mismo cambiado a la vez en las dos ramas y de distinta manera. */
export interface MergeConflict {
  /** La cosa afectada (`pages/contacto`, `globalCss`…). */
  node: string;
  /** Dónde dentro de ella (`title.text`, `blocks/b1`…); vacío si es toda la cosa. */
  property: string;
  base: unknown;
  into: unknown;
  from: unknown;
  resolution: "into" | "from" | null;
}

export type Resolutions = ReadonlyMap<string, "into" | "from">;
export const conflictKey = (node: string, property: string): string => `${node}|${property}`;

type Json = Record<string, unknown>;
const isObject = (value: unknown): value is Json => typeof value === "object" && value !== null && !Array.isArray(value);
const hasId = (item: unknown): item is Json & { id: string } => isObject(item) && typeof item.id === "string";
/** Una lista de cosas con id (páginas, secciones…) se fusiona cosa por cosa; las demás listas son un solo valor. */
const isIdList = (value: unknown): value is (Json & { id: string })[] => Array.isArray(value) && value.length > 0 && value.every(hasId);

interface Context {
  resolutions: Resolutions;
  conflicts: MergeConflict[];
}

/** La cosa son las dos primeras partes de la ruta (`pages/contacto`); el resto es la propiedad dentro de ella. */
function split(path: string[]): { node: string; property: string } {
  return { node: path.slice(0, 2).join("/"), property: path.slice(2).join(".") };
}

function conflict(context: Context, path: string[], base: unknown, into: unknown, from: unknown): unknown {
  const { node, property } = split(path);
  const resolution = context.resolutions.get(conflictKey(node, property)) ?? null;
  context.conflicts.push({ node, property, base, into, from, resolution });
  return resolution === "from" ? from : into;
}

const idsOf = (list: Json[] | undefined): string[] => (list ?? []).map((item) => item.id as string);

/** Las listas con id se juntan por id: lo nuevo de cualquier lado entra, y lo que un lado borró (sin tocar el otro) se va. */
function mergeIdList(base: Json[] | undefined, into: Json[], from: Json[], path: string[], context: Context): Json[] {
  const byId = (list: Json[] | undefined) => new Map((list ?? []).map((item) => [item.id as string, item]));
  const [b, i, f] = [byId(base), byId(into), byId(from)];
  const merged = new Map<string, Json>();
  for (const id of new Set([...i.keys(), ...f.keys(), ...b.keys()])) {
    const value = merge(b.get(id), i.get(id), f.get(id), [...path, id], context);
    if (value !== undefined) merged.set(id, value as Json);
  }

  // Si solo una rama reordenó, manda su orden; si las dos, el de la rama de destino.
  const primary = !deepEqual(idsOf(base), idsOf(into)) || deepEqual(idsOf(base), idsOf(from)) ? idsOf(into) : idsOf(from);
  const order = [...primary, ...idsOf(from), ...idsOf(into)].filter((id, index, all) => merged.has(id) && all.indexOf(id) === index);
  return [...order, ...[...merged.keys()].filter((id) => !order.includes(id))].map((id) => merged.get(id)!);
}

function merge(base: unknown, into: unknown, from: unknown, path: string[], context: Context): unknown {
  if (deepEqual(into, from)) return into;
  if (deepEqual(base, into)) return from;
  if (deepEqual(base, from)) return into;

  if (isObject(into) && isObject(from) && (base === undefined || isObject(base))) {
    const result: Json = {};
    for (const key of new Set([...Object.keys(into), ...Object.keys(from), ...Object.keys(base ?? {})])) {
      const value = merge(base?.[key], into[key], from[key], [...path, key], context);
      if (value !== undefined) result[key] = value;
    }
    return result;
  }
  const emptyList = Array.isArray(base) && base.length === 0;
  if (isIdList(into) && isIdList(from) && (base === undefined || emptyList || isIdList(base))) {
    return mergeIdList(base as Json[] | undefined, into, from, path, context);
  }
  return conflict(context, path, base, into, from);
}

export interface MergeResult<T> {
  merged: T;
  conflicts: MergeConflict[];
}

/**
 * Fusión de tres vías: `base` es el punto donde se separaron las ramas, `into` la de destino hoy y `from` la que se envía.
 * Lo que solo cambió un lado entra solo; lo que cambiaron los dos de forma distinta es un conflicto. Un conflicto sin
 * resolución se queda con lo de destino; quien fusiona debe resolverlos todos antes.
 */
export function mergeSites<T>(base: T, into: T, from: T, resolutions: Resolutions = new Map()): MergeResult<T> {
  const context: Context = { resolutions, conflicts: [] };
  const merged = merge(base, into, from, [], context) as T;
  return { merged, conflicts: context.conflicts };
}
