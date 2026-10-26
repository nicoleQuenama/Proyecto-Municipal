"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch } from "react";
import { keepsUndo, undoLabel } from "./undo-rules";
import type { SiteAction, SiteState } from "./types";

export interface UndoToast {
  label: string;
  /** El sitio justo antes de eliminar. */
  snapshot: SiteState;
}

/**
 * Envuelve el dispatch del sitio: antes de una acción destructiva guarda una foto del sitio para poder deshacerla.
 * Solo se recuerda la última; cualquier otro trabajo nuevo cierra el aviso.
 */
export function useUndoableDispatch(state: SiteState, dispatch: Dispatch<SiteAction>) {
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);
  const [toast, setToast] = useState<UndoToast | null>(null);

  const wrapped = useCallback(
    (action: SiteAction) => {
      const label = undoLabel(action);
      if (label) setToast({ label, snapshot: latest.current });
      else if (!keepsUndo(action)) setToast(null);
      dispatch(action);
    },
    [dispatch],
  );

  const undo = useCallback(() => {
    if (toast) dispatch({ type: "project/load", state: toast.snapshot });
    setToast(null);
  }, [dispatch, toast]);

  const dismiss = useCallback(() => setToast(null), []);
  return { dispatch: wrapped, toast, undo, dismiss };
}
