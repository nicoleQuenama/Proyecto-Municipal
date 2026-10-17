"use client";

import { useCommands } from "../commands/commands-context";
import { useNavigation } from "./navigation-context";

/** Botón del header para probar la navegación como la vería un visitante. */
export function PreviewToggle() {
  const { mode, setMode } = useNavigation();
  const { withShortcut } = useCommands();
  const previewing = mode === "preview";

  return (
    <div className="flex shrink-0 items-center border-l border-line px-3">
      <button
        type="button"
        aria-pressed={previewing}
        title={withShortcut(previewing ? "Salir de la vista previa" : "Probar la navegación", "mode.preview")}
        onClick={() => setMode(previewing ? "edit" : "preview")}
        className={`flex h-7 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors ${
          previewing
            ? "border-accent bg-accent/25 text-accent"
            : "border-line text-ink hover:bg-hover"
        }`}
      >
        <span aria-hidden>{previewing ? "■" : "▶"}</span>
        {previewing ? "Salir" : "Probar"}
      </button>
    </div>
  );
}
