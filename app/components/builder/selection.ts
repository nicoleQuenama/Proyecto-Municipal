import { descendantIds } from "../canvas-editing/containers";
import type { CanvasElement } from "../site/types";
import type { BuilderState } from "./builder-types";

/** Los ids sin los que van dentro de otro de la lista: moverlos aparte los movería dos veces. */
export function withoutNested(elements: CanvasElement[], ids: string[]): string[] {
  const nested = new Set(ids.flatMap((id) => [...descendantIds(elements, id)]));
  return ids.filter((id) => !nested.has(id));
}

/** Todo lo seleccionado: el elemento principal (el que muestra el panel) y los sumados con Ctrl/⌘. */
export const selectedIdsOf = (state: Pick<BuilderState, "selectedId" | "alsoSelectedIds">): string[] =>
  state.selectedId ? [state.selectedId, ...state.alsoSelectedIds] : [];

/** Cambia la selección: sin `additive` queda solo `id`; con él se suma o se quita de las demás. */
export function selectIn(state: BuilderState, id: string | null, additive = false): BuilderState {
  if (id === null) return { ...state, selectedId: null, alsoSelectedIds: [] };
  if (!additive) return { ...state, selectedId: id, alsoSelectedIds: [] };

  const current = selectedIdsOf(state);
  // El principal va primero: el que se suma pasa a serlo; al quitar uno, lo es el siguiente más reciente.
  const next = current.includes(id) ? current.filter((other) => other !== id) : [id, ...current];
  const [primary = null, ...rest] = next;
  return { ...state, selectedId: primary, alsoSelectedIds: rest };
}

/** Deja como selección solo estos elementos (el primero es el principal). */
export function selectOnly(state: BuilderState, ids: string[]): BuilderState {
  const [primary = null, ...rest] = ids;
  return { ...state, selectedId: primary, alsoSelectedIds: rest };
}
