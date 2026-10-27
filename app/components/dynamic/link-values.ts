import { resolveRef } from "../data-sources/resolve";
import type { DataRef } from "../data-sources/types";
import type { RouteValues } from "./route-params";
import type { LinkParamValue } from "./types";

/** Entrega los datos ya traídos de una fuente (o undefined si todavía no llegan). */
export type DataReader = (sourceId: string) => unknown;

const asText = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value) : "";

/** El valor de un parámetro: el texto escrito, o el dato de la clave (con el índice de la copia que se pinta). */
export function resolveParam(
  value: LinkParamValue,
  read: DataReader,
  repeat: DataRef | undefined,
  index: number | null,
): string {
  if (typeof value === "string") return value.trim();
  return asText(resolveRef(read(value.sourceId), value, repeat, index)).trim();
}

/**
 * Lo que se da por hecho sin que nadie lo configure: en una sección repetida, un parámetro sin valor
 * (`:id`) toma la clave del mismo nombre de cada elemento de la lista (`items[0].id`).
 */
export function inferredParams(
  names: string[],
  given: Record<string, LinkParamValue> | undefined,
  repeat: DataRef | undefined,
): Record<string, LinkParamValue> {
  if (!repeat) return {};
  const missing = names.filter((name) => !given?.[name]);
  return Object.fromEntries(missing.map((name) => [name, { sourceId: repeat.sourceId, path: `${repeat.path}[0].${name}` }]));
}

/** Todos los parámetros de un enlace; los que no se pueden resolver todavía se omiten. */
export function resolveLinkParams(
  spec: Record<string, LinkParamValue> | undefined,
  read: DataReader,
  repeat: DataRef | undefined,
  index: number | null,
): RouteValues {
  const entries = Object.entries(spec ?? {}).map(([name, value]) => [name, resolveParam(value, read, repeat, index)] as const);
  return Object.fromEntries(entries.filter(([, value]) => value !== ""));
}
