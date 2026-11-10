export interface Page<T> {
  items: T[];
  page: number;
  pages: number;
  from: number;
  to: number;
  total: number;
}

/** Un trozo de la lista. La página se ajusta si queda fuera de rango (p. ej. tras filtrar o borrar). */
export function paginate<T>(list: T[], page: number, size: number): Page<T> {
  const pages = Math.max(1, Math.ceil(list.length / size));
  const current = Math.min(Math.max(page, 1), pages);
  const start = (current - 1) * size;
  const items = list.slice(start, start + size);
  return { items, page: current, pages, from: items.length ? start + 1 : 0, to: start + items.length, total: list.length };
}
