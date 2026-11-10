"use client";

import { useState } from "react";
import type { User } from "../auth/types";
import type { Unit } from "../../server/units/unit-store";
import type { UnitDraft } from "./use-units-admin";

interface Props {
  unit: Unit;
  people: User[];
  onSave: (draft: UnitDraft) => Promise<boolean>;
  onMembers: (userIds: string[]) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
}

const field = "h-8 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent";

/** Una unidad: su nombre, su tipo, quién la dirige, si exige revisión, si puede desplegar y quiénes están en ella. */
export function UnitCard({ unit, people, onSave, onMembers, onRemove }: Props) {
  const [name, setName] = useState(unit.name);
  const canDeploy = unit.overrides.find((item) => item.permission === "deploy")?.allowed ?? true;
  const save = (change: Partial<UnitDraft>) =>
    onSave({ name, kind: unit.kind, ownerId: unit.ownerId, reviewRequired: unit.reviewRequired, overrides: unit.overrides, ...change });
  const toggleMember = (id: string) => onMembers(unit.memberIds.includes(id) ? unit.memberIds.filter((member) => member !== id) : [...unit.memberIds, id]);

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-line p-3">
      <div className="flex gap-2">
        <input aria-label="Nombre de la unidad" value={name} onChange={(event) => setName(event.target.value)} onBlur={() => name.trim() && name !== unit.name && void save({ name })} className={`${field} min-w-0 flex-1`} />
        <select aria-label="Tipo de la unidad" value={unit.kind} onChange={(event) => void save({ kind: event.target.value as UnitDraft["kind"] })} className={field}>
          <option value="designer">Diseñadora</option>
          <option value="dev">Desarrolladora</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-[11px] text-ink-dim">
        Dueño (recibe las revisiones)
        <select aria-label="Dueño de la unidad" value={unit.ownerId ?? ""} onChange={(event) => void save({ ownerId: event.target.value || null })} className={`${field} flex-1`}>
          <option value="">Sin dueño (las revisa el superadmin)</option>
          {people.filter((person) => unit.memberIds.includes(person.id)).map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-[11px] text-ink">
        <input type="checkbox" checked={unit.reviewRequired} onChange={(event) => void save({ reviewRequired: event.target.checked })} />
        Todo pasa por revisión (solo el dueño publica directo)
      </label>
      <label className="flex items-center gap-2 text-[11px] text-ink">
        <input
          type="checkbox"
          checked={canDeploy}
          onChange={(event) => void save({ overrides: [...unit.overrides.filter((item) => item.permission !== "deploy"), ...(event.target.checked ? [] : [{ permission: "deploy", allowed: false }])] })}
        />
        Puede desplegar el sitio
      </label>
      <fieldset className="flex flex-wrap gap-x-3 gap-y-1 border-t border-line pt-2">
        <legend className="px-1 text-[10px] font-semibold uppercase tracking-wider text-ink-dim">Personas</legend>
        {people.map((person) => (
          <label key={person.id} className="flex items-center gap-1.5 text-[11px] text-ink">
            <input type="checkbox" checked={unit.memberIds.includes(person.id)} onChange={() => void toggleMember(person.id)} />
            {person.name}
          </label>
        ))}
      </fieldset>
      <button type="button" onClick={() => void onRemove()} className="self-start text-[11px] text-red-500 hover:underline cursor-pointer">
        Borrar unidad
      </button>
    </li>
  );
}
