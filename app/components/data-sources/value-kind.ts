/** Qué clase de dato es algo que llegó de una API. */
export type ValueKind = "empty" | "scalar" | "scalars" | "object" | "records";

export type Scalar = string | number | boolean;

export const isScalar = (value: unknown): value is Scalar =>
  typeof value === "string" || typeof value === "number" || typeof value === "boolean";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * `scalars` = lista de textos/números; `records` = lista de objetos (noticias, productos…);
 * `object` = un objeto suelto.
 */
export function kindOf(value: unknown): ValueKind {
  if (value === undefined || value === null) return "empty";
  if (isScalar(value)) return "scalar";
  if (Array.isArray(value)) return value.length > 0 && value.every((item) => !isScalar(item) && item !== null) ? "records" : "scalars";
  return "object";
}
