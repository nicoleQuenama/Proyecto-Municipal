import { useSyncExternalStore } from "react";

/** Dónde va cada sección paginada: la página que se ve y lo último que se supo de la lista (para que la barra no parpadee). */
export interface BlockPaging {
  page: number;
  /** Total de elementos conocido (null = la API no lo dice). */
  total: number | null;
  /** Cuántos elementos trajo la última respuesta. */
  shown: number;
}

const START: BlockPaging = { page: 1, total: null, shown: 0 };

/** Vive en el navegador, fuera del sitio guardado: la página actual no es parte del diseño. */
const states = new Map<string, BlockPaging>();
const listeners = new Set<() => void>();

const read = (blockId: string): BlockPaging => states.get(blockId) ?? START;

function write(blockId: string, change: Partial<BlockPaging>) {
  const current = read(blockId);
  const next = { ...current, ...change };
  if (next.page === current.page && next.total === current.total && next.shown === current.shown) return;
  states.set(blockId, next);
  listeners.forEach((listener) => listener());
}

export const goToPage = (blockId: string, page: number) => write(blockId, { page: Math.max(1, Math.round(page)) });
export const rememberList = (blockId: string, total: number | null, shown: number) => write(blockId, { total, shown });

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

export const usePagingState = (blockId: string): BlockPaging =>
  useSyncExternalStore(subscribe, () => read(blockId), () => START);
