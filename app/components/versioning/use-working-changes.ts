"use client";

import { useMemo } from "react";
import { diffSnapshots } from "./design-snapshot";
import { useDesignSnapshot } from "./use-design-snapshot";
import { useVersioning } from "./versioning-context";

/** Los cambios sin guardar: lo que difiere entre el diseño de ahora y la última versión guardada de la rama. */
export function useWorkingChanges() {
  const { baseline } = useVersioning();
  const current = useDesignSnapshot();
  return useMemo(() => ({ changes: diffSnapshots(baseline, current) }), [baseline, current]);
}
