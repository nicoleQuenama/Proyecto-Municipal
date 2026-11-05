"use client";

import { useVersioning } from "./versioning-context";
import { useWorkingChanges } from "./use-working-changes";

/** Guardar una versión: entra todo lo que cambió en la rama (la versión es una foto de la rama, no una selección). */
export function useSaveVersion() {
  const { saveVersion } = useVersioning();
  const { changes } = useWorkingChanges();

  const save = async (message: string) => {
    if (changes.length === 0) return "No hay cambios para guardar.";
    return saveVersion(message, changes);
  };

  return { toSave: changes, save, hasChanges: changes.length > 0 };
}
