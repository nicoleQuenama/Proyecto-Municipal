/** Paginación de listas (lógica pura): rangos de páginas, desplazamiento y recorte de la lista. */

/** Dónde está la paginación de una sección: la página que se ve y de cuántos elementos es cada una. */
export interface PagingState {
  page: number;
  size: number;
}

/** Sin paginación de una sección (p. ej. «Probar» en la pestaña Datos), una API pide la primera página. */
export const FIRST_PAGE: PagingState = { page: 1, size: 10 };

/** Cómo viaja la paginación hacia las URLs: con los parámetros de la página (claves con `$`, que no chocan con `{param:x}`). */
export const PAGING_KEYS = { page: "$page", offset: "$offset", limit: "$limit" } as const;

export const MIN_SIZE = 1;
export const MAX_SIZE = 50;

export const clampSize = (size: number): number => Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(size) || MIN_SIZE));

/** Cuántas páginas hay para `total` elementos. */
export const pageCount = (total: number, size: number): number => Math.max(1, Math.ceil(total / size));

/** Los valores de `{page}`, `{offset}` y `{limit}` para pedir esa página al servidor. */
export const serverParams = ({ page, size }: PagingState) => ({ page, offset: (page - 1) * size, limit: size });

/** La paginación de una sección como parámetros para las URLs (`{page}`, `{offset}`, `{limit}`). */
export function pagingParams(paging: PagingState): Record<string, string> {
  const { page, offset, limit } = serverParams(paging);
  return { [PAGING_KEYS.page]: String(page), [PAGING_KEYS.offset]: String(offset), [PAGING_KEYS.limit]: String(limit) };
}

/** Qué parte de una lista completa se ve en la página: desde qué elemento y cuántos. */
export function windowOf(listLength: number, { page, size }: PagingState): { start: number; count: number } {
  const lastStart = Math.floor((Math.max(listLength, 1) - 1) / size) * size;
  const start = Math.min((page - 1) * size, lastStart);
  return { start, count: Math.max(0, Math.min(size, listLength - start)) };
}

/** Los botones numerados: 1 … 4 5 6 … 20. Siempre la primera y la última, y las vecinas de la actual. */
export function pageButtons(current: number, pages: number, around = 1): (number | "…")[] {
  const wanted = new Set([1, pages, current]);
  for (let step = 1; step <= around; step++) {
    wanted.add(current - step);
    wanted.add(current + step);
  }
  const sorted = [...wanted].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1] === 2 ? [n - 1, n] : i > 0 && n - sorted[i - 1] > 2 ? ["…" as const, n] : [n]));
}

/** Lo que necesita la barra para dibujarse. */
export interface PagerModel {
  page: number;
  /** Botones numerados; vacío cuando no se sabe el total (solo «Anterior» y «Siguiente»). */
  buttons: (number | "…")[];
  hasPrev: boolean;
  hasNext: boolean;
}

/**
 * El modelo de la barra. Con total conocido hay botones numerados; sin él (una API que no dice cuántos hay) solo
 * hay «Siguiente» mientras la API siga devolviendo una página completa.
 */
export function pagerModel(page: number, size: number, total: number | null, shown: number): PagerModel {
  if (total === null) return { page, buttons: [], hasPrev: page > 1, hasNext: shown >= size };
  const pages = pageCount(total, size);
  const current = Math.min(page, pages);
  return { page: current, buttons: pageButtons(current, pages), hasPrev: current > 1, hasNext: current < pages };
}
