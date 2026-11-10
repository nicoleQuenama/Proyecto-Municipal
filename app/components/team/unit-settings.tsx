"use client";

import { useState } from "react";
import type { User } from "../auth/types";
import type { Unit } from "../../server/units/unit-store";
import type { UnitDraft } from "../units/use-units-admin";

interface Props {
  unit: Unit;
  people: User[];
  onSave: (draft: UnitDraft) => Promise<boolean>;
  onMembers: (userIds: string[]) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
  onCreatePerson?: () => void;
}

const field = "h-10 rounded-lg border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent";
const label = "flex flex-col gap-1.5 text-xs font-medium text-ink-dim";

/** La configuración de la unidad elegida: nombre, tipo, dueño, revisión, despliegue y sus personas. */
export function UnitSettings({ unit, people, onSave, onMembers, onRemove, onCreatePerson }: Props) {
  const [name, setName] = useState(unit.name);
  const [pick, setPick] = useState("");
  const [busy, setBusy] = useState(false);
  const canDeploy = unit.overrides.find((item) => item.permission === "deploy")?.allowed ?? true;
  const save = (change: Partial<UnitDraft>) =>
    onSave({ name, kind: unit.kind, ownerId: unit.ownerId, reviewRequired: unit.reviewRequired, overrides: unit.overrides, ...change });
  const byName = (a: User, b: User) => a.name.localeCompare(b.name, "es");
  const members = people.filter((person) => unit.memberIds.includes(person.id)).sort(byName);
  const candidates = people.filter((person) => !unit.memberIds.includes(person.id)).sort(byName);

  const add = async () => {
    if (!pick || busy) return;
    setBusy(true);
    const ok = await onMembers([...unit.memberIds, pick]);
    setBusy(false);
    if (ok) setPick("");
  };

  const remove = async (userId: string) => {
    if (busy) return;
    setBusy(true);
    await onMembers(unit.memberIds.filter((id) => id !== userId));
    setBusy(false);
  };

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

      <div className="col-span-3 flex flex-col gap-2 border-t border-line pt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-ink">Personas de la unidad</p>
            <span className="text-[11px] text-ink-dim">({members.length} {members.length === 1 ? "persona" : "personas"})</span>
          </div>
          {onCreatePerson && (
            <button
              type="button"
              onClick={onCreatePerson}
              className="text-xs font-semibold text-accent hover:underline cursor-pointer"
            >
              + Crear nueva persona
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {members.map((person) => (
            <span key={person.id} title={person.email} className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas py-0.5 pl-2 pr-1 text-xs text-ink">
              <span className="max-w-48 truncate">{person.name}</span>
              <button
                type="button"
                aria-label={`Quitar a ${person.name} de la unidad`}
                title={`Quitar a ${person.name} de la unidad`}
                disabled={busy}
                onClick={() => void remove(person.id)}
                className="flex h-4 w-4 items-center justify-center rounded-full text-ink-dim hover:bg-red-500/15 hover:text-red-400 disabled:opacity-40 cursor-pointer"
              >
                ×
              </button>
            </span>
          ))}
          {members.length === 0 && <p className="text-xs text-ink-dim">Todavía no hay nadie en esta unidad.</p>}
        </div>
        {candidates.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <select
              aria-label={`Añadir una persona a ${unit.name}`}
              value={pick}
              onChange={(event) => setPick(event.target.value)}
              className={`${field} min-w-0 flex-1`}
            >
              <option value="">Elegir persona existente para añadir…</option>
              {candidates.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} · {person.email}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!pick || busy}
              onClick={() => void add()}
              className="h-10 shrink-0 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {busy ? "Añadiendo…" : "Añadir a unidad"}
            </button>
            {onCreatePerson && (
              <button
                type="button"
                onClick={onCreatePerson}
                className="h-10 shrink-0 rounded-lg border border-line bg-canvas px-3 text-xs font-medium text-ink hover:bg-hover hover:text-accent transition-colors cursor-pointer"
              >
                + Nueva persona
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-line p-3">
            <p className="text-xs text-ink-dim">
              {people.length === 0
                ? "Todavía no hay personas creadas en el equipo."
                : "Todas las personas del equipo ya pertenecen a esta unidad."}
            </p>
            {onCreatePerson && (
              <button
                type="button"
                onClick={onCreatePerson}
                className="h-9 shrink-0 rounded-lg bg-accent px-3.5 text-xs font-medium text-white transition-colors hover:bg-accent/90 cursor-pointer"
              >
                + Crear nueva persona
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
