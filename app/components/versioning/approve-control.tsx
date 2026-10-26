"use client";

import { useState } from "react";
import type { PullRequest } from "./types";
import { useVersioning } from "./versioning-context";
import { approversOf } from "./versioning-rules";

/** Elige quién aprueba (entre los miembros) y registra la aprobación. */
export function ApproveControl({ pr }: { pr: PullRequest }) {
  const { state, dispatch } = useVersioning();
  const approvers = approversOf(pr, state.members);
  const [picked, setPicked] = useState("");
  const by = approvers.includes(picked) ? picked : approvers[0];

  return (
    <div className="flex items-center gap-1.5">
      <select
        aria-label="Aprobar como"
        value={by ?? ""}
        disabled={!by}
        onChange={(e) => setPicked(e.target.value)}
        className="h-8 rounded-md border border-line bg-canvas px-2 text-xs outline-none [&>option]:bg-panel"
      >
        {approvers.map((name) => <option key={name}>{name}</option>)}
      </select>
      <button
        type="button"
        disabled={!by}
        onClick={() => dispatch({ type: "pr/approve", number: pr.number, by })}
        className="h-8 rounded-md border border-line px-3 text-xs hover:bg-hover disabled:opacity-40"
      >
        Aprobar cambios
      </button>
    </div>
  );
}
