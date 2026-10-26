import { expandTokens } from "./url-tokens";
import type { DataSource } from "./types";

/** Los parámetros de la página dinámica en pantalla (`{ id: "25" }`). */
export type PageParams = Record<string, string>;

const encodeAll = (params: PageParams): PageParams =>
  Object.fromEntries(Object.entries(params).map(([name, value]) => [name, encodeURIComponent(value)]));

/**
 * La URL final: la base más los parámetros (los vacíos se omiten) y con las claves ya cambiadas por su valor.
 * Un `{param:x}` sin valor deja la URL sin resolver (null): no se pide algo a medias.
 */
export function buildUrl(
  source: Pick<DataSource, "url" | "query">,
  now: Date = new Date(),
  params: PageParams = {},
): string | null {
  try {
    const url = new URL(expandTokens(source.url.trim(), now, encodeAll(params)));
    // La query se codifica sola al guardarla, por eso aquí van los valores sin codificar.
    for (const { key, value } of source.query) if (key.trim()) url.searchParams.set(key.trim(), expandTokens(value, now, params));
    const text = url.toString();
    return /\{param:|%7Bparam:/.test(text) ? null : text;
  } catch {
    return null;
  }
}

/**
 * Identifica una fuente para la caché del navegador: misma URL, método, cabeceras y código de transformación = mismos
 * datos. El código cuenta porque dos fuentes pueden pedir la misma URL y dar forma distinta a la respuesta.
 * La URL ya lleva los parámetros de la página, así cada id se guarda aparte.
 */
export const requestKey = (source: DataSource, params: PageParams = {}): string =>
  JSON.stringify([source.method, buildUrl(source, new Date(), params), source.headers.filter((h) => h.key.trim()), source.transform.trim()]);
