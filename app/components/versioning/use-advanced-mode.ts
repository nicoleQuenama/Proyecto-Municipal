"use client";

import { useState } from "react";

const STORAGE_KEY = "portal.versions.advanced";

function read(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** El modo avanzado (ramas, revisiones y tareas) se recuerda en este navegador; sin almacenamiento, empieza apagado. */
export function useAdvancedMode(): [boolean, (on: boolean) => void] {
  const [advanced, setAdvanced] = useState(read);

  const set = (on: boolean) => {
    setAdvanced(on);
    try {
      localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
    } catch {
      // Sin almacenamiento disponible: el cambio vale solo mientras el panel esté abierto.
    }
  };

  return [advanced, set];
}
