/**
 * Reglas puras del orden de las capas. Los ids van de atrás hacia delante: el último es el que se ve encima
 * (así se dibujan los elementos de un componente). El panel los muestra al revés: arriba lo de delante.
 */

/** Hacia dónde se mueve una capa. */
export type LayerStep = "forward" | "backward";

/** Encima («above») o debajo («below») de otra capa, tal como se ve en el panel. */
export type LayerPlace = "above" | "below";

const STEP_OFFSET: Record<LayerStep, number> = { forward: 1, backward: -1 };

export const frontToBack = <T>(items: readonly T[]): T[] => [...items].reverse();

/** ¿Se puede mover esa capa en esa dirección? */
export function canStep(ids: readonly string[], id: string, step: LayerStep): boolean {
  const index = ids.indexOf(id);
  const target = index + STEP_OFFSET[step];
  return index >= 0 && target >= 0 && target < ids.length;
}

/** Sube o baja una capa un lugar. */
export function stepLayer(ids: readonly string[], id: string, step: LayerStep): string[] {
  if (!canStep(ids, id, step)) return [...ids];
  const next = [...ids];
  const index = ids.indexOf(id);
  const target = index + STEP_OFFSET[step];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** Suelta una capa encima o debajo de otra (arrastrando en el panel). */
export function dropLayer(ids: readonly string[], id: string, targetId: string, place: LayerPlace): string[] {
  if (id === targetId || !ids.includes(id) || !ids.includes(targetId)) return [...ids];
  const rest = ids.filter((other) => other !== id);
  const at = rest.indexOf(targetId) + (place === "above" ? 1 : 0);
  return [...rest.slice(0, at), id, ...rest.slice(at)];
}

/** Ordena según una lista de ids; lo que no aparece en ella queda delante, en su orden. */
export function sortByOrder<T extends { id: string }>(items: readonly T[], order: readonly string[] | undefined): T[] {
  if (!order || order.length === 0) return [...items];
  const rank = new Map(order.map((id, index) => [id, index]));
  const known = (item: T) => rank.get(item.id) ?? Number.MAX_SAFE_INTEGER;
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => known(a.item) - known(b.item) || a.index - b.index)
    .map(({ item }) => item);
}
