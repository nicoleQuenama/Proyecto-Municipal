"use client";

import { useVersioning } from "./versioning-context";
import { useWorkingChanges } from "./use-working-changes";

/**
 * Guardar una versión: entran los cambios que la persona eligió o, si no eligió ninguno, todos.
 * Así quien no conoce el flujo solo escribe un mensaje, y quien quiere control elige qué entra.
 */
export function useSaveVersion() {
  const { dispatch } = useVersioning();
  const { changes, staged } = useWorkingChanges();
  const toSave = staged.length > 0 ? staged : changes;

  const save = (message: string) => {
    if (toSave.length === 0) return "No hay cambios para guardar.";
    dispatch({ type: "commit", message, changes: toSave, at: new Date().toISOString() });
  };

  return { toSave, save, hasChanges: changes.length > 0 };
}
