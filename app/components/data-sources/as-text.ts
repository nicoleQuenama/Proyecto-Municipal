import { isRecord, isScalar } from "./value-kind";

/** Un objeto como líneas «clave: valor» (lo de dentro, con su ruta: «autor.nombre: Ana»). */
function lines(value: unknown, prefix = ""): string[] {
  if (isScalar(value)) return [prefix ? `${prefix}: ${value}` : String(value)];
  if (Array.isArray(value)) return value.flatMap((item, i) => lines(item, prefix ? `${prefix}[${i}]` : ""));
  if (isRecord(value)) return Object.entries(value).flatMap(([key, inner]) => lines(inner, prefix ? `${prefix}.${key}` : key));
  return [];
}

/**
 * El dato como texto para un elemento: un valor suelto tal cual, una lista de textos con un elemento por línea
 * y un objeto o lista de objetos como «clave: valor» en cada línea.
 */
export function asText(value: unknown): string {
  if (value === undefined || value === null) return "";
  return lines(value).join("\n");
}

/** ¿Es una lista (para dibujarla como lista con viñetas)? */
export const isListValue = (value: unknown): boolean => Array.isArray(value);
