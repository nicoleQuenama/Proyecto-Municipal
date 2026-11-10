"use client";

import { useState } from "react";
import type { User } from "../auth/types";
import type { Unit } from "../../server/units/unit-store";
import type { UnitDraft } from "../units/use-units-admin";

interface Props {
  unit: Unit;
  people: User[];
  onSave: (draft: UnitDraft) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
}

const field = "h-10 rounded-lg border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent";
const label = "flex flex-col gap-1.5 text-xs font-medium text-ink-dim";

/** La configuración de la unidad elegida: nombre, tipo, dueño, revisión y despliegue. Las personas se marcan en la tabla. */
export function UnitSettings({ unit, people, onSave, onRemove }: Props) {
  const [name, setName] = useState(unit.name);
  const canDeploy = unit.overrides.find((item) => item.permission === "deploy")?.allowed ?? true;
  const save = (change: Partial<UnitDraft>) =>
    onSave({ name, kind: unit.kind, ownerId: unit.ownerId, reviewRequired: unit.reviewRequired, overrides: unit.overrides, ...change });
  const members = people.filter((person) => unit.memberIds.includes(person.id));

  return (
    <section aria-label={`Configuración de ${unit.name}`} className="grid grid-cols-3 gap-4 rounded-xl border border-line bg-panel p-4">
      <label className={label}>
        Nombre
        <input aria-label="Nombre de la unidad" value={name} onChange={(event) => setName(event.target.value)} onBlur={() => name.trim() && name !== unit.name && void save({ name })} className={field} />
      </label>
      <label className={label}>
        Tipo (techo de permisos)
        <select aria-label="Tipo de la unidad" value={unit.kind} onChange={(event) => void save({ kind: event.target.value as UnitDraft["kind"] })} className={field}>
          <option value="designer">Diseñadora: contenido y estructura</option>
          <option value="dev">Desarrolladora: además estilos y código</option>
        </select>
      </label>
      <label className={label}>
        Dueño (recibe las revisiones)
        <select aria-label="Dueño de la unidad" value={unit.ownerId ?? ""} onChange={(event) => void save({ ownerId: event.target.value || null })} className={field}>
          <option value="">Sin dueño: revisa el superadmin</option>
          {members.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2.5 text-sm text-ink">
        <input type="checkbox" className="h-4 w-4" checked={unit.reviewRequired} onChange={(event) => void save({ reviewRequired: event.target.checked })} />
        Todo pasa por revisión (solo el dueño publica directo)
      </label>
      <label className="flex items-center gap-2.5 text-sm text-ink">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={canDeploy}
          onChange={(event) => void save({ overrides: [...unit.overrides.filter((item) => item.permission !== "deploy"), ...(event.target.checked ? [] : [{ permission: "deploy", allowed: false }])] })}
        />
        Puede desplegar el sitio
      </label>
      <button type="button" onClick={() => void onRemove()} className="justify-self-end text-sm text-red-400 hover:underline cursor-pointer">Borrar unidad</button>
    </section>
  );
}
