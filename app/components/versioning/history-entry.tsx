"use client";

import { useState } from "react";
import { Avatar } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { ChevronIcon } from "../viewport/icons";
import { ChangeChip } from "./diff-row";
import type { Commit } from "./types";

const time = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" });

interface HistoryEntryProps {
  commit: Commit;
  live: boolean;
  /** Se muestra la rama cuando el historial junta todas. */
  showBranch: boolean;
}

/** Una versión guardada: una línea, y al abrirla los cambios que trajo. */
export function HistoryEntry({ commit, live, showBranch }: HistoryEntryProps) {
  const [open, setOpen] = useState(false);

  return (
    <li className="rounded-lg border border-line">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-hover"
      >
        <Avatar name={commit.author} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium">{commit.message}</span>
          <span className="block truncate text-xs text-ink-dim">
            {commit.author} · {time.format(new Date(commit.at))}
            {showBranch && ` · ${commit.branch}`} · <code>{commit.id}</code>
          </span>
        </span>
        {live && <Badge tone="success">En vivo</Badge>}
        <span className="shrink-0 text-xs text-ink-dim">{commit.changes.length} cambios</span>
        <span aria-hidden className={`text-ink-dim transition-transform ${open ? "rotate-180" : ""}`}>
          <ChevronIcon size={10} />
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-1.5 border-t border-line px-3 py-2">
          {commit.changes.length === 0 ? (
            <p className="text-xs text-ink-dim">Sin cambios detallados en este prototipo.</p>
          ) : (
            commit.changes.map((change) => (
              <ChangeChip key={`${change.node}-${change.property}-${change.after}`} change={change} showNode />
            ))
          )}
        </div>
      )}
    </li>
  );
}
