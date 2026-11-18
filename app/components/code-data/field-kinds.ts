import type { CellValue } from "./types";

export type FieldKind = "link" | "media" | "number" | "boolean" | "text";

/** Qué campo usa el modal para un texto, según la palabra que lleva su clave. El orden decide: lo primero que coincide. */
const TEXT_KINDS: ReadonlyArray<readonly [RegExp, FieldKind]> = [
  [/link|url|href|ruta/i, "link"],
  [/img|image|imagen|src|foto/i, "media"],
];

/** Qué campo usa el modal para cada tipo de valor que no es texto. */
const VALUE_KINDS: Record<"number" | "boolean", FieldKind> = { number: "number", boolean: "boolean" };

/** El campo de una celda; `readonly` si su valor se calcula en el código y no se puede editar desde el lienzo. */
export function fieldKind(key: string, value: CellValue | null): FieldKind | "readonly" {
  if (value === null) return "readonly";
  if (typeof value !== "string") return VALUE_KINDS[typeof value as "number" | "boolean"];
  return TEXT_KINDS.find(([pattern]) => pattern.test(key))?.[1] ?? "text";
}
