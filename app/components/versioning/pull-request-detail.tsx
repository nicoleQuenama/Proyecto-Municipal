"use client";

import { Badge, type BadgeTone } from "../ui/badge";
import { Section } from "../ui/section";
import { ConflictCard } from "./conflict-card";
import { CommitCard } from "./commit-card";
import { applyChanges, DEFAULT_MODEL } from "./preview-model";
import { VisualDiff } from "./visual-diff";
import { ApproveControl } from "./approve-control";
import { TeamReview } from "./team-review";
import { type PullRequest, type PullRequestStatus } from "./types";
import { AlertIcon, CheckIcon } from "./versioning-icons";
import { useVersioning } from "./versioning-context";
import { canDeleteBranch, headOf, mergeBlockers, plural } from "./versioning-rules";

export const STATUS_LABELS: Record<PullRequestStatus, { label: string; tone: BadgeTone }> = {
  open: { label: "Abierto", tone: "success" },
  merged: { label: "Fusionado", tone: "accent" },
  closed: { label: "Cerrado", tone: "neutral" },
};

export function PullRequestDetail({ pr }: { pr: PullRequest }) {
  const { state, dispatch } = useVersioning();
  const mergedBranch = state.branches.find((b) => b.name === pr.from);
  const head = headOf(state.commits, pr.from);
  const isOpen = pr.status === "open";
  const blockers = mergeBlockers(pr);
  const status = STATUS_LABELS[pr.status];

  return (
    <div className="flex flex-col gap-5 p-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-sm font-semibold">
            {pr.title} <span className="font-normal text-ink-dim">#{pr.number}</span>
          </h2>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        <p className="text-xs text-ink-dim">
          {pr.author} quiere fusionar <code className="text-ink">{pr.from}</code> en{" "}
          <code className="text-ink">{pr.into}</code>
        </p>
      </header>

      {pr.status === "merged" && mergedBranch && canDeleteBranch(mergedBranch) && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas px-3 py-2.5">
          <p className="text-xs text-ink-dim">
            La rama <code className="text-ink">{pr.from}</code> ya fue fusionada y se puede eliminar.
          </p>
          <button
            type="button"
            onClick={() => dispatch({ type: "branch/delete", name: pr.from })}
            className="h-7 shrink-0 rounded-md border border-red-500/60 px-3 text-xs text-red-400 hover:bg-red-500/15"
          >
            Eliminar rama
          </button>
        </div>
      )}

      {pr.conflicts.length > 0 ? (
        <Section title="Conflictos de merge">
          <p role="alert" className="flex items-center gap-2 text-xs text-red-400">
            <AlertIcon />
            {plural(pr.conflicts.length, "elemento fue modificado", "elementos fueron modificados")} en
            ambas ramas. Elige qué valor conservar.
          </p>
          <ul className="flex flex-col gap-2">
            {pr.conflicts.map((conflict, index) => (
              <ConflictCard
                key={`${conflict.node}-${conflict.property}`}
                conflict={conflict}
                intoBranch={pr.into}
                fromBranch={pr.from}
                disabled={!isOpen}
                onResolve={(resolution) =>
                  dispatch({ type: "pr/resolve", number: pr.number, index, resolution })
                }
              />
            ))}
          </ul>
        </Section>
      ) : (
        isOpen && (
          <p className="flex items-center gap-2 text-xs text-green-400">
            <CheckIcon /> Sin conflictos con «{pr.into}».
          </p>
        )
      )}

      <Section title={`Cambios (${pr.changes.length})`}>
        {head && <CommitCard label="Último commit de la rama" commit={head} />}
        <VisualDiff
          beforeLabel={pr.into}
          afterLabel={pr.from}
          before={DEFAULT_MODEL}
          after={applyChanges(DEFAULT_MODEL, pr.changes, "after")}
          changes={pr.changes}
        />
      </Section>

      <Section title={`Revisión (${pr.approvals.length}/${pr.requiredApprovals})`}>
        <div className="flex flex-wrap items-center gap-2">
          {pr.approvals.map((name) => (
            <Badge key={name} tone="success">✓ {name}</Badge>
          ))}
          {pr.approvals.length === 0 && (
            <span className="text-xs text-ink-dim">Nadie ha aprobado todavía.</span>
          )}
        </div>

        {pr.authorId !== undefined && <TeamReview pr={pr} />}

        {isOpen && pr.authorId === undefined && (
          <>
            {blockers.length > 0 && (
              <ul className="flex flex-col gap-1 text-xs text-amber-400">
                {blockers.map((reason) => (
                  <li key={reason}>• {reason}</li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap gap-2">
              <ApproveControl pr={pr} />
              <button
                type="button"
                disabled={blockers.length > 0}
                onClick={() => dispatch({ type: "pr/merge", number: pr.number, at: new Date().toISOString() })}
                className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-white disabled:opacity-40"
              >
                Hacer merge
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "pr/close", number: pr.number })}
                className="h-8 rounded-md px-3 text-xs text-ink-dim hover:bg-hover hover:text-ink"
              >
                Cerrar PR
              </button>
            </div>
          </>
        )}
      </Section>
    </div>
  );
}
