"use client";

import { useState } from "react";
import { UserForm } from "../auth/user-form";
import type { useUsers } from "../auth/use-users";
import type { useUnitsAdmin } from "../units/use-units-admin";
import { Modal } from "../ui/modal";
import { useToast } from "../ui/toast";
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

const field = "h-10 rounded-lg border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent";

/** Administración del equipo a pantalla grande: unidades a la izquierda; a la derecha, la unidad elegida y las personas. */
export function TeamWorkspace({ users, admin, onClose }: Props) {
  const toast = useToast();
  const [unitId, setUnitId] = useState("");
  const [filter, setFilter] = useState<PeopleFilter>(NO_FILTER);
  const [pageNumber, setPageNumber] = useState(1);
  const [creating, setCreating] = useState(false);
  const [newUnitId, setNewUnitId] = useState("");
  const unit = admin.units.find((item) => item.id === unitId) ?? null;
  const shown = filterPeople(users.users, admin.units, { ...filter, unitId: unit?.id ?? "" });
  const people = users.users.filter((user) => user.role !== "superadmin");

  const toggle = (ids: string[], id: string) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);

  const openCreate = () => {
    setNewUnitId(unit?.id ?? "");
    setCreating(true);
  };

  const createPerson = async (event: React.FormEvent) => {
    const target = admin.units.find((item) => item.id === newUnitId) ?? null;
    const user = await users.submit(event);
    if (!user) return;

    if (target) {
      const ok = await admin.setMembers(target.id, [...new Set([...target.memberIds, user.id])]);
      if (ok) toast.success(`«${user.name}» creado y añadido a «${target.name}».`);
      else toast.error(`La persona se creó, pero no se pudo añadir a «${target.name}».`);
    } else {
      toast.success(`«${user.name}» creado.`);
    }
    setCreating(false);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Equipo</h2>
          <p className="text-sm text-ink-dim">Quién entra al CMS, a qué unidad pertenece y qué puede tocar.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={openCreate} className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent/90 cursor-pointer">
            + Nueva persona
          </button>
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-line px-4 text-sm text-ink hover:bg-hover cursor-pointer">Cerrar</button>
        </div>
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
          {unit && (
            <UnitSettings
              key={`${unit.id}-${unit.name}`}
              unit={unit}
              people={people}
              onSave={(draft) => admin.update(unit.id, draft)}
              onMembers={(ids) => admin.setMembers(unit.id, ids)}
              onRemove={async () => { const ok = await admin.remove(unit.id); if (ok) setUnitId(""); return ok; }}
              onCreatePerson={() => {
                setNewUnitId(unit.id);
                setCreating(true);
              }}
            />
          )}
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1"><PeopleFilters filter={filter} onChange={(next) => { setFilter(next); setPageNumber(1); }} /></div>
            {unit && (
              <p className="max-w-md text-xs leading-relaxed text-ink-dim">
                Mostrando solo las personas de «{unit.name}». Para sumar a alguien, usa «Personas de la unidad» arriba o crea una cuenta nueva.
              </p>
            )}
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
            emptyText={filter.query || filter.role ? "Nadie coincide con la búsqueda." : unit ? "Esta unidad todavía no tiene personas. Añádelas en «Personas de la unidad»." : "Todavía no hay usuarios."}
            onRemove={users.remove}
            onMember={(target, userId) => void admin.setMembers(target.id, toggle(target.memberIds, userId))}
            onGlobal={(userId) => void admin.setGlobalEditors(toggle(admin.globalEditorIds, userId))}
          />
          <p className="text-xs text-ink-dim">«Global» es lo que ven todas las unidades (cabecera, pie, estilos y servidores): solo lo editan el superadministrador y quienes marques.</p>
        </main>
      </div>

      {creating && (
        <Modal label="Nueva persona" size="md" onClose={() => setCreating(false)}>
          <div className="flex max-h-[80vh] flex-col gap-3 overflow-y-auto p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-ink">Nueva persona</h3>
                <p className="mt-1 text-xs text-ink-dim">Se crea la cuenta y se envía la contraseña temporal por correo.</p>
              </div>
              <button type="button" onClick={() => setCreating(false)} className="h-8 rounded-lg border border-line px-3 text-xs text-ink hover:bg-hover cursor-pointer">
                Cerrar
              </button>
            </div>
            {admin.units.length > 0 && (
              <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-dim">
                Unidad
                <select aria-label="Unidad de la nueva persona" value={newUnitId} onChange={(event) => setNewUnitId(event.target.value)} className={field}>
                  <option value="">Sin unidad (solo lo global, si tiene permiso)</option>
                  {admin.units.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <span className="text-[11px] font-normal leading-snug text-ink-dim">La persona se añadirá a esta unidad al crearla.</span>
              </label>
            )}
            <UserForm
              name={users.name}
              username={users.username}
              email={users.email}
              password={users.password}
              role={users.role}
              saving={users.saving}
              error={users.error}
              notice={users.notice}
              onName={users.setName}
              onUsername={users.setUsername}
              onEmail={users.setEmail}
              onPassword={users.setPassword}
              onRole={users.setRole}
              onSubmit={createPerson}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
