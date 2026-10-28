"use client";

import type { ReactNode } from "react";
import { PublishPanel } from "./publish-panel";
import { ResetHistory } from "./reset-history";
import { SaveVersionForm } from "./save-version-form";
import { StatusCard } from "./status-card";
import { formatDateTime } from "./format-date";
import { useVersioning } from "./versioning-context";
import { useWorkingChanges } from "./use-working-changes";
import { headOf, plural } from "./versioning-rules";

function Block({ title, step, children }: { title: string; step: number; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-line p-4">
      <h3 className="flex items-center gap-2 text-[13px] font-semibold">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-hover text-[11px] text-ink-dim">{step}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

/** El punto de partida: cómo está el trabajo y los dos pasos que importan, guardar y publicar. */
export function OverviewTab({ onGoTo }: { onGoTo: (tab: "changes" | "history") => void }) {
  const { state } = useVersioning();
  const { changes } = useWorkingChanges();

  const head = headOf(state.commits, state.current);
  const live = state.releases[0];
  const isLive = head !== undefined && live?.commitId === head.id;

  return (
    <div className="flex flex-col gap-4 p-4">
      {state.commits.length === 0 && (
        <p className="rounded-lg bg-hover px-4 py-3 text-xs text-ink-dim">
          Bienvenido. Aquí guardas versiones de tu trabajo (como puntos de restauración) y las publicas en la página
          oficial. Empieza editando algo en el lienzo: los cambios aparecerán abajo para guardarlos.
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        <StatusCard
          title="Sin guardar"
          value={plural(changes.length, "cambio", "cambios")}
          hint={changes.length > 0 ? "Aún no están en ninguna versión" : "Todo está guardado"}
          tone={changes.length > 0 ? "warning" : "success"}
        />
        <StatusCard
          title="Última versión"
          value={head ? head.message : "Ninguna"}
          hint={head ? `${head.author} · ${formatDateTime(head.at)}` : "Guarda la primera"}
        />
        <StatusCard
          title="En la página oficial"
          value={live ? live.message : "Nada publicado"}
          hint={isLive ? "Está al día" : live ? formatDateTime(live.at) : "Aún no se publicó"}
          tone={isLive ? "success" : "neutral"}
        />
      </div>

      <Block step={1} title="Guardar los cambios como una versión">
        {changes.length > 0 ? (
          <>
            <SaveVersionForm />
            <button type="button" onClick={() => onGoTo("changes")} className="self-start text-xs text-accent hover:underline">
              Revisar o elegir qué cambios entran →
            </button>
          </>
        ) : (
          <p className="text-xs text-ink-dim">No hay nada pendiente: todos tus cambios ya están guardados.</p>
        )}
      </Block>

      <Block step={2} title="Publicar en la página oficial">
        <PublishPanel />
      </Block>

      {(state.commits.length > 0 || state.releases.length > 0) && <ResetHistory />}

      {state.commits.length > 0 && (
        <button type="button" onClick={() => onGoTo("history")} className="self-start text-xs text-accent hover:underline">
          Ver el historial de {plural(state.commits.length, "versión", "versiones")} →
        </button>
      )}
    </div>
  );
}
