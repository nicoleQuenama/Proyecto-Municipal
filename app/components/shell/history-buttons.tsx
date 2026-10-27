"use client";

import { useHistoryControls } from "../site/history-context";

const button =
  "flex h-7 w-8 items-center justify-center rounded-md text-sm text-ink hover:bg-hover disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent";

/** Deshacer y rehacer en la barra superior, con cuántos pasos hay a cada lado. */
export function HistoryButtons() {
  const { undo, redo, undoCount, redoCount } = useHistoryControls();

  return (
    <div role="group" aria-label="Historial" className="flex items-center gap-0.5 self-center px-2">
      <button type="button" aria-label="Deshacer" title={`Deshacer (Ctrl+Z) · ${undoCount} ${undoCount === 1 ? "paso" : "pasos"}`} disabled={undoCount === 0} onClick={undo} className={button}>
        ↶
      </button>
      <button type="button" aria-label="Rehacer" title={`Rehacer (Ctrl+Mayús+Z) · ${redoCount} ${redoCount === 1 ? "paso" : "pasos"}`} disabled={redoCount === 0} onClick={redo} className={button}>
        ↷
      </button>
    </div>
  );
}
