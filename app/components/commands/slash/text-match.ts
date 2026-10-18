/** Minúsculas y sin tildes, para que "angulo" encuentre "Ángulo". */
export const normalize = (text: string): string =>
  text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** ¿Aparecen en `text` todas las palabras de `query`, en cualquier orden? */
export function matchesQuery(text: string, query: string): boolean {
  const haystack = normalize(text);
  return normalize(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export function filterByQuery<T extends { label: string; hint?: string }>(items: T[], query: string): T[] {
  return items.filter((item) => matchesQuery(`${item.label} ${item.hint ?? ""}`, query));
}
