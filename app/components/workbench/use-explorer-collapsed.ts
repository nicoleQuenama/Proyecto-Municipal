"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

const KEY = "workbench.explorer.collapsed";
const listeners = new Set<() => void>();
let collapsed: boolean | null = null;

const read = (): boolean => {
  if (collapsed === null) {
    try {
      collapsed = sessionStorage.getItem(KEY) === "1";
    } catch {
      collapsed = false;
    }
  }
  return collapsed;
};

const write = (next: boolean) => {
  collapsed = next;
  try {
    sessionStorage.setItem(KEY, next ? "1" : "0");
  } catch {
    // Sin almacenamiento: el estado vive solo mientras la página siga abierta.
  }
  listeners.forEach((listener) => listener());
};

/** ¿Está recogido el explorador de archivos? Se recuerda durante la sesión; Ctrl+B lo alterna. */
export function useExplorerCollapsed(): [boolean, () => void] {
  const value = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    read,
    () => false,
  );
  const toggle = useCallback(() => write(!read()), []);

  // En captura y deteniendo el evento: Ctrl+B aquí no alterna el panel lateral de la página.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey || e.key.toLowerCase() !== "b") return;
      e.preventDefault();
      e.stopPropagation();
      toggle();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [toggle]);

  return [value, toggle];
}
