import { useCallback, useSyncExternalStore } from "react";

/** Interruptores de la vista (no se guardan): «menú abierto», «ver el recorte»… por clave, p. ej. `menu:<bloque>`. */
const on = new Set<string>();
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

function setFlag(key: string, value: boolean) {
  if (on.has(key) === value) return;
  if (value) on.add(key);
  else on.delete(key);
  listeners.forEach((listener) => listener());
}

/** Un interruptor compartido entre el control del editor y la sección que lo muestra. */
export function useFlag(key: string): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(subscribe, () => on.has(key), () => false);
  const set = useCallback((next: boolean) => setFlag(key, next), [key]);
  return [value, set];
}
