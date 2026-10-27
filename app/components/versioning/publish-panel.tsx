"use client";

import { useState } from "react";
import { formatDateTime } from "./format-date";
import { usePublish } from "./use-publish";
import { useVersioning } from "./versioning-context";
import { useWorkingChanges } from "./use-working-changes";
import { headOf, publishBlockers } from "./versioning-rules";

/** Quien no puede publicar en main: sus cambios se envían como pull request a quien lo invitó. */
function SendForReview() {
  const { state, submitReview } = useVersioning();
  const { changes } = useWorkingChanges();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const main = state.branches.find((branch) => branch.base === null)?.name ?? "main";
  const head = headOf(state.commits, state.current);
  const waiting = state.pullRequests.some((pr) => pr.status === "open" && pr.from === state.current && pr.into === main && pr.authorId);
  const blockers = [
    ...(changes.length > 0 ? [`Tienes ${changes.length} ${changes.length === 1 ? "cambio" : "cambios"} sin guardar. Guárdalos como una versión antes de enviar.`] : []),
    ...(!head ? ["Tu rama todavía no tiene versiones. Haz una versión para poder enviarla."] : []),
    ...(waiting ? ["Ya enviaste esta rama: espera a que la revisen."] : []),
  ];

  const send = async () => {
    if (!head) return;
    setBusy(true);
    setError("");
    try {
      await submitReview(head.message, state.current, main);
      setSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo enviar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-md bg-hover px-3 py-2 text-xs leading-relaxed">
        Trabajas en tu rama <code className="text-ink">{state.current}</code>. No puedes publicar directo en <code className="text-ink">{main}</code>:
        al publicar, tus cambios llegan como <b>pull request</b> a quien te invitó, y solo esa persona puede aprobarlos.
      </p>
      {blockers.length > 0 && (
        <ul className="flex flex-col gap-1 text-xs text-amber-400">
          {blockers.map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
      )}
      <button type="button" disabled={blockers.length > 0 || busy} onClick={send} className="h-9 self-start rounded-md bg-accent px-4 text-xs font-medium text-white disabled:opacity-40">
        {busy ? "Enviando…" : "Publicar (enviar a revisión)"}
      </button>
      {sent && (
        <p role="status" className="text-xs text-green-400">
          ¡Enviado! Se te avisará aquí cuando lo revisen.
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

/** Publicar la última versión guardada a la página oficial, con confirmación y el resultado a la vista. */
export function PublishPanel() {
  const { state, mustBranch } = useVersioning();
  const { changes } = useWorkingChanges();
  const { status, publish } = usePublish();
  const [confirming, setConfirming] = useState(false);

  if (mustBranch) return <SendForReview />;

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
        {" en la página oficial."}
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
          ¡Publicado! Ya está en la página oficial.
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
