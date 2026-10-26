"use client";

import { useEffect } from "react";
import type { UndoToast as UndoToastData } from "./use-undoable-dispatch";

const VISIBLE_MS = 8000;

interface UndoToastProps {
  toast: UndoToastData | null;
  onUndo: () => void;
  onDismiss: () => void;
}

/** Aviso «Eliminado · Deshacer»: se queda unos segundos abajo en el centro. */
export function UndoToast({ toast, onUndo, onDismiss }: UndoToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-lg border border-line bg-panel px-4 py-2 text-sm text-ink shadow-2xl"
    >
      {toast.label}
      <button type="button" onClick={onUndo} className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-white hover:opacity-90">
        Deshacer
      </button>
      <button type="button" aria-label="Cerrar aviso" onClick={onDismiss} className="text-ink-dim hover:text-ink">
        ×
      </button>
    </div>
  );
}
