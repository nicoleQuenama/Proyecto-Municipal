"use client";

import { useState, type FormEvent } from "react";
import type { MemberRole } from "./types";
import { useVersioning } from "./versioning-context";
import { memberProblem } from "./versioning-rules";

const ROLES: MemberRole[] = ["Editor", "Revisor"];

/** Invita a una persona por nombre o correo con el rol elegido. */
export function InviteForm() {
  const { state, dispatch } = useVersioning();
  const [name, setName] = useState("");
  const [role, setRole] = useState<MemberRole>("Editor");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const problem = memberProblem(state.members, name);
    if (problem) return setError(problem);
    dispatch({ type: "member/add", name, role });
    setName("");
    setError(null);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <input
          aria-label="Nombre o correo de la persona"
          placeholder="Nombre o correo"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(null); }}
          className="h-9 min-w-0 flex-1 rounded-md border border-line bg-canvas px-3 text-[13px] outline-none placeholder:text-ink-dim focus:border-accent"
        />
        <select
          aria-label="Rol"
          value={role}
          onChange={(e) => setRole(e.target.value as MemberRole)}
          className="h-9 rounded-md border border-line bg-canvas px-2 text-xs outline-none focus:border-accent [&>option]:bg-panel"
        >
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
        <button type="submit" disabled={!name.trim()} className="h-9 shrink-0 rounded-md bg-accent px-3 text-xs font-medium text-white disabled:opacity-40">
          Invitar
        </button>
      </div>
      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
    </form>
  );
}
