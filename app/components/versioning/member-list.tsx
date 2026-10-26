"use client";

import { Avatar } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { CURRENT_USER } from "./types";
import { useVersioning } from "./versioning-context";

/** Quién participa en el proyecto; a cada persona se la puede quitar salvo a uno mismo. */
export function MemberList() {
  const { state, dispatch } = useVersioning();

  return (
    <ul className="flex flex-col gap-1">
      {state.members.map((member) => (
        <li key={member.name} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
          <Avatar name={member.name} />
          <span className="min-w-0 flex-1 truncate text-[13px]">
            {member.name}
            {member.name === CURRENT_USER && <span className="text-ink-dim"> (tú)</span>}
          </span>
          <Badge tone={member.role === "Editor" ? "accent" : "neutral"}>{member.role}</Badge>
          {member.name !== CURRENT_USER && (
            <button
              type="button"
              aria-label={`Quitar a ${member.name}`}
              onClick={() => dispatch({ type: "member/remove", name: member.name })}
              className="h-7 rounded-md px-2 text-xs text-ink-dim hover:bg-hover hover:text-red-400"
            >
              Quitar
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
