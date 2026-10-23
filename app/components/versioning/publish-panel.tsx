"use client";

import { useState } from "react";
import { formatDateTime } from "./format-date";
import { usePublish } from "./use-publish";
import { useVersioning } from "./versioning-context";
import { useWorkingChanges } from "./use-working-changes";
import { headOf, publishBlockers } from "./versioning-rules";

/** Publicar la última versión guardada a la página oficial, con confirmación y el resultado a la vista. */
export function PublishPanel() {
  const { state } = useVersioning();
  const { changes } = useWorkingChanges();
  const { status, publish, site } = usePublish();
  const [confirming, setConfirming] = useState(false);

  const head = headOf(state.commits, state.current);
  const blockers = publishBlockers({ unsavedCount: changes.length, head, live: state.releases[0] });
  const busy = status.kind === "publishing";

  const confirm = async () => {
    setConfirming(false);
    await publish();
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-ink-dim">
        {head ? `Se publicará «${head.message}»` : "Todavía no hay una versión para publicar"}
        {site ? ` en ${site}.` : " en la página oficial."}
        {state.releases[0] && ` Ahora mismo se ve la del ${formatDateTime(state.releases[0].at)}.`}
      </p>

      {blockers.length > 0 && (
        <ul className="flex flex-col gap-1 text-xs text-amber-400">
          {blockers.map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
      )}

      {confirming ? (
        <div role="alertdialog" aria-label="Confirmar publicación" className="flex flex-wrap items-center gap-2">
          <p className="w-full text-xs">Esto cambia lo que ven los visitantes. ¿Publicar ahora?</p>
          <button type="button" onClick={confirm} className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-white">
            Sí, publicar
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="h-8 rounded-md px-3 text-xs text-ink-dim hover:bg-hover hover:text-ink">
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={blockers.length > 0 || busy}
          onClick={() => setConfirming(true)}
          className="h-9 self-start rounded-md bg-accent px-4 text-xs font-medium text-white disabled:opacity-40"
        >
          {busy ? "Publicando…" : "Publicar"}
        </button>
      )}

      {status.kind === "done" && (
        <p role="status" className="text-xs text-green-400">
          ¡Publicado! {status.site ? `Los cambios ya se ven en ${status.site}.` : "Ya está en la página oficial."}
        </p>
      )}
      {status.kind === "error" && (
        <p role="alert" className="text-xs text-red-400">
          {status.message}
        </p>
      )}
    </div>
  );
}
