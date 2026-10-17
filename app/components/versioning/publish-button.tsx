"use client";

import { useCommands } from "../commands/commands-context";
import { UploadIcon } from "../viewport/icons";
import { useWorkingChanges } from "./use-working-changes";

/** Acceso directo del header al flujo de publicación, con el número de cambios sin guardar. */
export function PublishButton() {
  const { openDialog } = useCommands();
  const { changes } = useWorkingChanges();

  return (
    <div className="flex shrink-0 items-center border-l border-line px-3">
      <button
        type="button"
        title="Añadir cambios, hacer una versión y publicar"
        onClick={() => openDialog("versions")}
        className="flex h-7 items-center gap-1.5 rounded-md bg-accent px-3 text-xs font-medium text-white hover:bg-accent/90"
      >
        <UploadIcon />
        Publicar
        {changes.length > 0 && (
          <span
            aria-label={`${changes.length} cambios sin guardar`}
            className="rounded-full bg-white/25 px-1.5 text-[11px]"
          >
            {changes.length}
          </span>
        )}
      </button>
    </div>
  );
}
