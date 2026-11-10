"use client";

import { useState } from "react";
import { UserForm } from "../auth/user-form";
import type { useUsers } from "../auth/use-users";
import type { useUnitsAdmin } from "../units/use-units-admin";
import { Disclosure } from "./disclosure";
import { filterPeople, NO_FILTER, type PeopleFilter } from "./filter-people";
import { PeopleFilters } from "./people-filters";
import { PeopleTable } from "./people-table";
import { UnitSettings } from "./unit-settings";
import { UnitSidebar } from "./unit-sidebar";

interface Props {
  users: ReturnType<typeof useUsers>;
  admin: ReturnType<typeof useUnitsAdmin>;
  onClose: () => void;
}

/** Administración del equipo a pantalla grande: unidades a la izquierda; a la derecha, la unidad elegida y las personas. */
export function TeamWorkspace({ users, admin, onClose }: Props) {
  const [unitId, setUnitId] = useState("");
  const [filter, setFilter] = useState<PeopleFilter>(NO_FILTER);
  const [pageNumber, setPageNumber] = useState(1);
  const unit = admin.units.find((item) => item.id === unitId) ?? null;
  const shown = filterPeople(users.users, admin.units, { ...filter, unitId: unit?.id ?? "" });
  const people = users.users.filter((user) => user.role !== "superadmin");
  const filtered = Boolean(filter.query || filter.role || unit);

  const toggle = (ids: string[], id: string) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Equipo</h2>
          <p className="text-sm text-ink-dim">Quién entra al CMS, a qué unidad pertenece y qué puede tocar.</p>
        </div>
        <button type="button" onClick={onClose} className="h-10 rounded-lg border border-line px-4 text-sm text-ink hover:bg-hover cursor-pointer">Cerrar</button>
      </header>
      <div className="flex min-h-0 flex-1">
        <UnitSidebar
          units={admin.units}
          totalPeople={users.users.length}
          selectedId={unitId}
          onSelect={(id) => { setUnitId(id); setPageNumber(1); }}
          onCreate={admin.create}
        />
        <main className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
          <p role="alert" className={`text-sm text-red-400 ${admin.error ? "" : "hidden"}`}>{admin.error}</p>
          {unit && <UnitSettings key={`${unit.id}-${unit.name}`} unit={unit} people={people} onSave={(draft) => admin.update(unit.id, draft)} onRemove={async () => { const ok = await admin.remove(unit.id); if (ok) setUnitId(""); return ok; }} />}
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <PeopleFilters filter={filter} onChange={(next) => { setFilter(next); setPageNumber(1); }} />
            </div>
            <Disclosure className="w-96 shrink-0" summary={<span className="text-sm font-medium text-accent">+ Nueva persona</span>}>
              <UserForm name={users.name} username={users.username} email={users.email} password={users.password} role={users.role} saving={users.saving} error={users.error} notice={users.notice} onName={users.setName} onUsername={users.setUsername} onEmail={users.setEmail} onPassword={users.setPassword} onRole={users.setRole} onSubmit={users.submit} />
            </Disclosure>
          </div>
          <PeopleTable
            users={shown}
            units={admin.units}
            unit={unit}
            globalIds={admin.globalEditorIds}
            pageNumber={pageNumber}
            onPage={setPageNumber}
            currentUserId={users.currentUser?.id}
            loading={users.loading}
            removingId={users.removingId}
            emptyText={filtered ? "Nadie coincide con la búsqueda." : "Todavía no hay usuarios."}
            onRemove={users.remove}
            onMember={(target, userId) => void admin.setMembers(target.id, toggle(target.memberIds, userId))}
            onGlobal={(userId) => void admin.setGlobalEditors(toggle(admin.globalEditorIds, userId))}
          />
          <p className="text-xs text-ink-dim">«Global» es lo que ven todas las unidades (cabecera, pie, estilos y servidores): solo lo editan el superadministrador y quienes marques.</p>
        </main>
      </div>
    </div>
  );
}
