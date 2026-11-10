"use client";

import { useState } from "react";
import { hasPermission, useAuth } from "../auth/auth-context";
import { UnitCard } from "./unit-card";
import { useUnitsAdmin } from "./use-units-admin";

/** Unidades (departamentos) de la organización: solo para quien administra usuarios. */
export function UnitsAdminPanel() {
  const { currentUser, users } = useAuth();
  const admin = useUnitsAdmin();
  const [name, setName] = useState("");
  if (!hasPermission(currentUser, "manageUsers")) return null;

  const people = users.filter((user) => user.role !== "superadmin");
  const toggleGlobal = (id: string) => admin.setGlobalEditors(admin.globalEditorIds.includes(id) ? admin.globalEditorIds.filter((item) => item !== id) : [...admin.globalEditorIds, id]);
  const create = async () => {
    if (name.trim() && (await admin.create({ name, kind: "designer", ownerId: null, reviewRequired: false, overrides: [] }))) setName("");
  };

  return (
    <section className="flex flex-col gap-3" aria-label="Unidades">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-dim">Departamentos</p>
        <p className="mt-1 text-sm font-semibold text-ink">Unidades</p>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-dim">
          Cada unidad ve y edita solo sus páginas y archivos, y puede publicar y desplegar. Lo global (cabecera, pie, estilos y servidores) lo editan quienes marques abajo.
        </p>
      </div>
      {admin.error && <p role="alert" className="text-xs text-red-400">{admin.error}</p>}
      <div className="flex gap-2">
        <input aria-label="Nombre de la nueva unidad" value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void create()} placeholder="Nueva unidad (p. ej. Zoonosis)" className="h-8 min-w-0 flex-1 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent" />
        <button type="button" onClick={() => void create()} className="h-8 rounded-md bg-accent px-3 text-xs text-white cursor-pointer">
          Crear
        </button>
      </div>
      <ul className="flex flex-col gap-2">
        {admin.units.map((unit) => (
          <UnitCard key={`${unit.id}-${unit.name}`} unit={unit} people={people} onSave={(draft) => admin.update(unit.id, draft)} onMembers={(ids) => admin.setMembers(unit.id, ids)} onRemove={() => admin.remove(unit.id)} />
        ))}
      </ul>
      {admin.units.length > 0 && (
        <fieldset className="flex flex-wrap gap-x-3 gap-y-1 rounded-lg border border-line p-3">
          <legend className="px-1 text-[10px] font-semibold uppercase tracking-wider text-ink-dim">Pueden editar lo global</legend>
          {people.map((person) => (
            <label key={person.id} className="flex items-center gap-1.5 text-[11px] text-ink">
              <input type="checkbox" checked={admin.globalEditorIds.includes(person.id)} onChange={() => void toggleGlobal(person.id)} />
              {person.name}
            </label>
          ))}
        </fieldset>
      )}
    </section>
  );
}
