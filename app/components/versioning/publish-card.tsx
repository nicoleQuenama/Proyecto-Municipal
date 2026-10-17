"use client";

import { useState } from "react";
import { Badge } from "../ui/badge";
import { formatDateTime } from "./format-date";
import { useVersioning } from "./versioning-context";
import { headOf, publishBlockers } from "./versioning-rules";

/** Paso 3: publicar la última versión guardada de la rama actual a la página oficial. */
export function PublishCard({ unsavedCount }: { unsavedCount: number }) {
  const { state, dispatch } = useVersioning();
  const [confirming, setConfirming] = useState(false);

  const head = headOf(state.commits, state.current);
  const live = state.releases[0];
  const blockers = publishBlockers({ unsavedCount, head, live });

  const publish = () => {
    dispatch({ type: "publish", at: new Date().toISOString() });
    setConfirming(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <dl className="flex flex-col gap-2 rounded-lg border border-line bg-canvas p-3 text-xs">
        <div className="flex items-start justify-between gap-3">
          <dt className="shrink-0 text-ink-dim">En la página oficial ahora</dt>
          <dd className="text-right">
            {live ? `«${live.message}» · ${live.branch} · ${formatDateTime(live.at)}` : "Nada publicado todavía"}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="shrink-0 text-ink-dim">Se publicará</dt>
          <dd className="text-right">
            {head ? `«${head.message}» · ${state.current}` : "—"}
          </dd>
        </div>
      </dl>

      {blockers.length > 0 && (
        <ul className="flex flex-col gap-1 text-xs text-amber-400">
          {blockers.map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
      )}

      {confirming ? (
        <div role="alertdialog" aria-label="Confirmar publicación" className="flex flex-wrap items-center gap-2">
          <p className="w-full text-xs">
            Esto reemplaza lo que ven los visitantes en la página oficial. ¿Publicar ahora?
          </p>
          <button
            type="button"
            onClick={publish}
            className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-white"
          >
            Sí, publicar
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="h-8 rounded-md px-3 text-xs text-ink-dim hover:bg-hover hover:text-ink"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={blockers.length > 0}
            onClick={() => setConfirming(true)}
            className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-white disabled:opacity-40"
          >
            Publicar a la página oficial
          </button>
          <span className="text-xs text-ink-dim">Puedes publicar desde cualquier rama.</span>
        </div>
      )}

      {state.releases.length > 0 && (
        <div className="flex flex-col gap-1">
          <h4 className="text-[11px] font-semibold tracking-wider text-ink-dim uppercase">
            Publicaciones
          </h4>
          <ul className="flex flex-col gap-1">
            {state.releases.map((release, index) => (
              <li
                key={release.id}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-xs hover:bg-hover"
              >
                <span className="min-w-0 truncate">{release.message}</span>
                <span className="flex shrink-0 items-center gap-2 text-ink-dim">
                  {release.branch} · {release.author} · {formatDateTime(release.at)}
                  {index === 0 && <Badge tone="success">En vivo</Badge>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
