"use client";

import { hasPermission, useAuth } from "../auth/auth-context";
import { pendingFor } from "./group-rules";
import { useVersioning } from "./versioning-context";
import { useCommands } from "../commands/commands-context";
import { UploadIcon } from "../viewport/icons";
import { ShareButton } from "./share-button";
import { useWorkingChanges } from "./use-working-changes";

/** Acceso directo del header al flujo de publicación, con el número de cambios sin guardar. */
export function PublishButton() {
  const { openDialog } = useCommands();
  const { changes } = useWorkingChanges();
  const { currentUser } = useAuth();
  const { state } = useVersioning();
  const pending = pendingFor(currentUser, state.pullRequests).length;
  const canViewAudit = hasPermission(currentUser, "viewAudit");

  return (
    <div className="flex shrink-0 items-center gap-2 border-l border-line px-3">
      <ShareButton className="h-7 rounded-md border border-line px-3 text-xs hover:bg-hover" />
      {canViewAudit && (
        <button
          type="button"
          title="Revisar rendimiento, accesibilidad y SEO antes de publicar"
          onClick={() => openDialog("audit")}
          className="flex h-7 items-center gap-1.5 rounded-md border border-line px-3 text-xs hover:bg-hover"
        >
          Auditoría
        </button>
      )}
      {pending > 0 && (
        <button
          type="button"
          title="Pull requests de tu grupo esperando tu revisión"
          onClick={() => openDialog("versions")}
          className="flex h-7 items-center gap-1.5 rounded-md border border-amber-400/60 bg-amber-400/10 px-3 text-xs font-medium text-amber-300 hover:bg-amber-400/20"
        >
          {pending} por revisar
        </button>
      )}
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
