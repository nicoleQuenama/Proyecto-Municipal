/** El historial de cambios del sitio, para deshacer y rehacer (lógica pura). */

import type { SiteAction, SiteState } from "./types";

export interface History {
  past: SiteState[];
  future: SiteState[];
  /** Cuándo y con qué acción se anotó lo último: sirve para juntar los cambios seguidos de un mismo gesto. */
  lastAt: number;
  lastType: string | null;
}

export const EMPTY_HISTORY: History = { past: [], future: [], lastAt: 0, lastType: null };

/** Cuántos pasos se recuerdan. */
export const HISTORY_LIMIT = 100;
/** Dos cambios del mismo tipo con menos de esto entre sí son un solo paso (arrastrar, escribir, mover un control). */
export const COALESCE_MS = 600;

/** Lo que no es un cambio del sitio: seleccionar o cargar no se deshace. */
const UNTRACKED = new Set<SiteAction["type"]>(["project/load", "block/select", "element/select", "page/select", "block/select-many"]);

export const isTracked = (action: SiteAction): boolean => !UNTRACKED.has(action.type);

/** Anota un cambio: guarda cómo estaba el sitio justo antes (salvo que siga el mismo gesto) y borra lo que se había deshecho. */
export function record(history: History, before: SiteState, action: SiteAction, now: number): History {
  if (!isTracked(action)) return history;
  const sameGesture = history.past.length > 0 && history.lastType === action.type && now - history.lastAt < COALESCE_MS;
  const past = sameGesture ? history.past : [...history.past, before].slice(-HISTORY_LIMIT);
  return { past, future: [], lastAt: now, lastType: action.type };
}

export function undoStep(history: History, current: SiteState): { history: History; state: SiteState } | null {
  const state = history.past.at(-1);
  if (!state) return null;
  return { state, history: { past: history.past.slice(0, -1), future: [current, ...history.future], lastAt: 0, lastType: null } };
}

export function redoStep(history: History, current: SiteState): { history: History; state: SiteState } | null {
  const [state, ...future] = history.future;
  if (!state) return null;
  return { state, history: { past: [...history.past, current], future, lastAt: 0, lastType: null } };
}
