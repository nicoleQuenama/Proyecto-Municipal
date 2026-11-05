"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { getPreference, isLoaded, loadPreferences, setPreference, subscribe } from "./preferences-store";

/**
 * Una preferencia de la persona, guardada en la base de datos. Devuelve `[valor, cambiar, listo]`: `listo` es verdadero cuando
 * ya llegó lo guardado (hasta entonces el valor es el de partida y no conviene escribir nada encima).
 * `fallback` debe ser una constante: un objeto nuevo en cada render haría que el valor cambie sin parar.
 */
export function usePreference<T>(key: string, fallback: T): [T, (value: T) => void, boolean] {
  useEffect(() => {
    void loadPreferences();
  }, []);
  const value = useSyncExternalStore(subscribe, () => getPreference(key, fallback), () => fallback);
  const ready = useSyncExternalStore(subscribe, isLoaded, () => false);
  const set = useCallback((next: T) => setPreference(key, next), [key]);
  return [value, set, ready];
}
