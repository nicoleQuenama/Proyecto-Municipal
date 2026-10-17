"use client";

import { useMemo } from "react";
import { diffSnapshots } from "./design-snapshot";
import { useDesignSnapshot } from "./use-design-snapshot";
import { useVersioning } from "./versioning-context";

/** Cambios sin guardar y, de ellos, los que ya se añadieron para la próxima versión. */
export function useWorkingChanges() {
  const { state } = useVersioning();
  const current = useDesignSnapshot();

  return useMemo(() => {
    const changes = diffSnapshots(state.baseline, current);
    const staged = changes.filter((change) => state.staged.includes(change.key));
    return { changes, staged };
  }, [state.baseline, state.staged, current]);
}
