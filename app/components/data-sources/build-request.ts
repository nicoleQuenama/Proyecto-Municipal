import type { DataSource } from "./types";

/** La URL final: la base más los parámetros (los vacíos se omiten). */
export function buildUrl(source: Pick<DataSource, "url" | "query">): string | null {
  try {
    const url = new URL(source.url.trim());
    for (const { key, value } of source.query) if (key.trim()) url.searchParams.set(key.trim(), value);
    return url.toString();
  } catch {
    return null;
  }
}

/** Identifica una petición para la caché: misma URL, método y cabeceras = misma respuesta. */
export const requestKey = (source: DataSource): string =>
  JSON.stringify([source.method, buildUrl(source), source.headers.filter((h) => h.key.trim())]);
