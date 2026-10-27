"use client";

import { useState } from "react";
import { useAuth } from "../auth/auth-context";
import { canReview } from "./group-rules";
import type { PullRequest } from "./types";
import { useVersioning } from "./versioning-context";

/**
 * La revisión de una pull request de equipo: solo la persona que invitó a su autor puede fusionarla (o rechazarla);
 * el autor ve a quién espera y puede cancelarla. Cualquier otra persona no la recibe.
 */
export function TeamReview({ pr }: { pr: PullRequest }) {
  const { currentUser } = useAuth();
  const { decide } = useVersioning();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reviewer = canReview(currentUser, pr);
  const open = pr.status === "open";

  const act = async (decision: "merge" | "close") => {
    setBusy(true);
    setError("");
    try {
      await decide(pr.number, decision);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo completar.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <p className="text-xs text-ink-dim">
        {pr.status === "merged" ? `Aprobada y fusionada por ${pr.approvals[0] ?? pr.reviewerName}.` : "Esta solicitud se cerró sin fusionarse."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-ink-dim">
        {reviewer
          ? `${pr.author} te envió estos cambios porque trabaja en tu grupo. Revísalos y decide.`
          : `Esperando la revisión de ${pr.reviewerName ?? "quien te invitó"}. Tus cambios no llegan a «${pr.into}» hasta que los apruebe.`}
      </p>
      <div className="flex flex-wrap gap-2">
        {reviewer && (
          <button type="button" disabled={busy} onClick={() => act("merge")} className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-white disabled:opacity-40">
            Aprobar y fusionar en {pr.into}
          </button>
        )}
        <button type="button" disabled={busy} onClick={() => act("close")} className="h-8 rounded-md px-3 text-xs text-ink-dim hover:bg-hover hover:text-ink disabled:opacity-40">
          {reviewer ? "Rechazar" : "Cancelar solicitud"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
