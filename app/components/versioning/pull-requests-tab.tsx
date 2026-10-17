"use client";

import { useState } from "react";
import { Badge } from "../ui/badge";
import { NewPullRequestForm } from "./new-pull-request-form";
import { PullRequestDetail, STATUS_LABELS } from "./pull-request-detail";
import { useVersioning } from "./versioning-context";

type Selection = number | "new" | null;

export function PullRequestsTab() {
  const { state } = useVersioning();
  const [selection, setSelection] = useState<Selection>(state.pullRequests[0]?.number ?? null);

  const selected = state.pullRequests.find((pr) => pr.number === selection);

  return (
    <div className="grid h-full grid-cols-[15rem_1fr]">
      <div className="flex min-h-0 flex-col gap-2 overflow-y-auto border-r border-line p-3">
        <button
          type="button"
          onClick={() => setSelection("new")}
          className={`h-8 rounded-md border border-dashed border-line text-xs hover:bg-hover ${
            selection === "new" ? "bg-hover" : ""
          }`}
        >
          + Nuevo pull request
        </button>

        <ul className="flex flex-col gap-1">
          {state.pullRequests.map((pr) => {
            const status = STATUS_LABELS[pr.status];
            const hasConflicts = pr.status === "open" && pr.conflicts.some((c) => c.resolution === null);

            return (
              <li key={pr.number}>
                <button
                  type="button"
                  aria-current={selection === pr.number}
                  onClick={() => setSelection(pr.number)}
                  className={`flex w-full flex-col gap-1 rounded-md px-2 py-2 text-left ${
                    selection === pr.number ? "bg-accent/20" : "hover:bg-hover"
                  }`}
                >
                  <span className="line-clamp-2 text-[13px] font-medium">
                    {pr.title} <span className="font-normal text-ink-dim">#{pr.number}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-1">
                    <Badge tone={status.tone}>{status.label}</Badge>
                    {hasConflicts && <Badge tone="danger">Conflictos</Badge>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="min-h-0 overflow-y-auto">
        {selection === "new" ? (
          <NewPullRequestForm onCreated={setSelection} />
        ) : selected ? (
          <PullRequestDetail key={selected.number} pr={selected} />
        ) : (
          <p className="p-8 text-center text-[13px] text-ink-dim">Selecciona un pull request.</p>
        )}
      </div>
    </div>
  );
}
