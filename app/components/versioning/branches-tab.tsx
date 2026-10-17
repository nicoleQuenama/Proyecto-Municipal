"use client";

import { useId, useState, type ReactNode } from "react";
import { Badge } from "../ui/badge";
import { InlineForm } from "../ui/inline-form";
import { ChevronIcon } from "../viewport/icons";
import { CommitCard } from "./commit-card";
import { DEFAULT_MODEL, modelAfter } from "./preview-model";
import type { Branch, Commit } from "./types";
import { useVersioning } from "./versioning-context";
import { VisualDiff } from "./visual-diff";
import { BranchIcon } from "./versioning-icons";
import {
  attributeChanges,
  canDeleteBranch,
  isBranchMerged,
  plural,
  slugifyBranchName,
  summarizeChanges,
} from "./versioning-rules";

interface BranchRowProps {
  branch: Branch;
  commits: Commit[];
  isCurrent: boolean;
  isMerged: boolean;
  onSwitch: () => void;
  onDelete: () => void;
}

const rowButton = "h-7 rounded-md border px-3 text-xs";

function VersionChip({
  active,
  title,
  onClick,
  children,
}: {
  active: boolean;
  title?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      title={title}
      onClick={onClick}
      className={`h-7 max-w-52 truncate rounded-md px-2.5 text-xs transition-colors ${
        active ? "bg-accent text-white" : "bg-hover text-ink-dim hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

/** Diff visual de una rama: toda la rama frente a su base, o una versión concreta. */
function BranchDetails({ branch, commits }: { branch: Branch; commits: Commit[] }) {
  const [selected, setSelected] = useState("all");

  if (commits.length === 0) {
    return (
      <p className="border-t border-line p-6 text-center text-xs text-ink-dim">
        Esta rama todavía no tiene versiones.
      </p>
    );
  }

  const oldestFirst = [...commits].reverse();
  const index = oldestFirst.findIndex((commit) => commit.id === selected);
  const picked = index >= 0 ? oldestFirst[index] : undefined;

  const before = picked ? modelAfter(oldestFirst, index) : DEFAULT_MODEL;
  const after = modelAfter(oldestFirst, picked ? index + 1 : oldestFirst.length);
  const changes = picked ? attributeChanges(picked) : summarizeChanges(commits);

  return (
    <div className="flex flex-col gap-4 border-t border-line p-3">
      <CommitCard
        label={picked ? "Versión seleccionada" : "Último commit"}
        commit={picked ?? commits[0]}
      />

      <div role="group" aria-label="Versiones de la rama" className="flex flex-wrap gap-1.5">
        <VersionChip active={!picked} onClick={() => setSelected("all")}>
          Toda la rama{branch.base && ` vs ${branch.base}`}
        </VersionChip>
        {oldestFirst.map((commit) => (
          <VersionChip
            key={commit.id}
            active={commit.id === picked?.id}
            title={commit.message}
            onClick={() => setSelected(commit.id)}
          >
            {commit.id} · {commit.message}
          </VersionChip>
        ))}
      </div>

      <VisualDiff
        beforeLabel={picked ? `antes de ${picked.id}` : (branch.base ?? "diseño inicial")}
        afterLabel={picked ? `${picked.id} · ${branch.name}` : branch.name}
        before={before}
        after={after}
        changes={changes}
      />
    </div>
  );
}

function BranchRow({ branch, commits, isCurrent, isMerged, onSwitch, onDelete }: BranchRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const detailsId = useId();
  const versions = plural(commits.length, "versión", "versiones");

  // Una rama fusionada ya no tiene trabajo pendiente: se elimina sin confirmar.
  const requestDelete = () => (isMerged ? onDelete() : setConfirming(true));

  return (
    <li
      className={`rounded-lg border ${isCurrent ? "border-accent/50 bg-accent/10" : "border-line"}`}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={detailsId}
          title="Ver versiones y cambios"
          onClick={() => setExpanded((open) => !open)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className={`text-ink-dim transition-transform ${expanded ? "" : "-rotate-90"}`}>
            <ChevronIcon />
          </span>
          <span className="text-ink-dim"><BranchIcon /></span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium">{branch.name}</span>
            {confirming ? (
              <span role="alert" className="block text-xs text-amber-400">
                Tiene {versions} sin fusionar. Se perderán.
              </span>
            ) : (
              <span className="block text-xs text-ink-dim">
                {branch.author}
                {branch.base && ` · creada desde ${branch.base}`}
              </span>
            )}
          </span>
        </button>

        {confirming ? (
          <>
            <button
              type="button"
              onClick={onDelete}
              className={`${rowButton} border-red-500/60 bg-red-500/15 text-red-400 hover:bg-red-500/25`}
            >
              Eliminar rama
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className={`${rowButton} border-line hover:bg-hover`}
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            <Badge>{versions}</Badge>
            {isMerged && <Badge tone="success">Fusionada</Badge>}
            {isCurrent ? (
              <Badge tone="accent">Actual</Badge>
            ) : (
              <button type="button" onClick={onSwitch} className={`${rowButton} border-line hover:bg-hover`}>
                Cambiar
              </button>
            )}
            {canDeleteBranch(branch) && (
              <button
                type="button"
                aria-label={`Eliminar la rama ${branch.name}`}
                onClick={requestDelete}
                className={`${rowButton} ${
                  isMerged
                    ? "border-red-500/60 text-red-400 hover:bg-red-500/15"
                    : "border-transparent text-ink-dim hover:bg-hover hover:text-red-400"
                }`}
              >
                Eliminar
              </button>
            )}
          </>
        )}
      </div>

      <div id={detailsId} hidden={!expanded}>
        {expanded && <BranchDetails branch={branch} commits={commits} />}
      </div>
    </li>
  );
}

export function BranchesTab() {
  const { state, dispatch } = useVersioning();

  const createBranch = (input: string) => {
    const name = slugifyBranchName(input);
    if (!name) return "Escribe un nombre válido.";
    if (state.branches.some((b) => b.name === name)) return "Ya existe una rama con ese nombre.";
    dispatch({ type: "branch/create", name });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <InlineForm
        label="Nombre de la nueva rama"
        placeholder={`Nueva rama desde «${state.current}»… (p. ej. nuevo-hero)`}
        submitLabel="Crear rama"
        onSubmit={createBranch}
      />

      <ul className="flex flex-col gap-1">
        {state.branches.map((branch) => (
          <BranchRow
            key={branch.name}
            branch={branch}
            commits={state.commits.filter((c) => c.branch === branch.name)}
            isCurrent={branch.name === state.current}
            isMerged={isBranchMerged(state.pullRequests, branch.name)}
            onSwitch={() => dispatch({ type: "branch/switch", name: branch.name })}
            onDelete={() => dispatch({ type: "branch/delete", name: branch.name })}
          />
        ))}
      </ul>
    </div>
  );
}
