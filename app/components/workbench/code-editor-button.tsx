"use client";

import { hasPermission, useAuth } from "../auth/auth-context";
import { useWorkbench } from "./workbench-context";

/** Botón visible y directo en la barra superior para abrir el editor de código. */
export function CodeEditorButton() {
  const { openFile } = useWorkbench();
  const { currentUser } = useAuth();
  if (!hasPermission(currentUser, "editCode")) return null;

  return (
    <button
      type="button"
      onClick={() => openFile()}
      title="Abrir editor de código HTML, CSS y TypeScript (Ctrl+E)"
      className="flex items-center gap-1.5 self-center mx-2 px-2.5 py-1 text-xs font-semibold rounded-md border border-line bg-canvas/70 text-ink hover:bg-hover hover:border-accent hover:text-accent transition-all cursor-pointer shadow-xs active:scale-95"
    >
      <span className="font-mono text-accent font-bold">&lt;/&gt;</span>
      <span>Editor de Código</span>
    </button>
  );
}
