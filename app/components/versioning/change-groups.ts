import type { Change } from "./types";

/** El grupo de un cambio es lo primero de su nombre: la página, «Estilos», «Sitio»… */
export const groupNameOf = (node: string): string => node.split(" · ")[0];

export interface ChangeGroup<T extends Change> {
  name: string;
  items: T[];
}

/** Agrupa los cambios por página o ámbito, en el orden en que aparecen. */
export function groupChanges<T extends Change>(changes: T[]): ChangeGroup<T>[] {
  const groups = new Map<string, T[]>();
  for (const change of changes) {
    const name = groupNameOf(change.node);
    groups.set(name, [...(groups.get(name) ?? []), change]);
  }
  return [...groups].map(([name, items]) => ({ name, items }));
}

/** Todas las palabras escritas deben aparecer en el elemento, la propiedad o los valores. */
export function matchesQuery(change: Change, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const text = `${change.node} ${change.property} ${change.before} ${change.after}`.toLowerCase();
  return words.every((word) => text.includes(word));
}
