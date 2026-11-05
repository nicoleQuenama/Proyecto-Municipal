"use client";

import { usePreference } from "../persistence/use-preference";

/** El modo avanzado (ramas, revisiones y tareas) se recuerda en la cuenta de la persona; empieza apagado. */
export function useAdvancedMode(): [boolean, (on: boolean) => void] {
  const [advanced, setAdvanced] = usePreference("versions.advanced", false);
  return [advanced, setAdvanced];
}
