"use client";

import { useState } from "react";
import { hasPermission } from "./auth-context";
import { useUsers } from "./use-users";
import { TeamWorkspace } from "../team/team-workspace";
import { Modal } from "../ui/modal";
import { useUnitsAdmin } from "../units/use-units-admin";

/** Entrada del panel lateral: un resumen y el botón que abre la administración del equipo a pantalla grande. */
export function UserManagement() {
  const users = useUsers();
  const admin = useUnitsAdmin();
  const [open, setOpen] = useState(false);
  if (!hasPermission(users.currentUser, "manageUsers")) return null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold text-ink">Equipo</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-dim">Quién entra al CMS, a qué unidad pertenece y qué puede tocar.</p>
      </div>
      <dl className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-line p-3"><dd className="text-xl font-semibold text-ink">{users.users.length}</dd><dt className="text-xs text-ink-dim">Personas</dt></div>
        <div className="rounded-lg border border-line p-3"><dd className="text-xl font-semibold text-ink">{admin.units.length}</dd><dt className="text-xs text-ink-dim">Unidades</dt></div>
      </dl>
      <button type="button" onClick={() => setOpen(true)} className="h-10 rounded-lg bg-accent text-sm font-semibold text-white cursor-pointer">Administrar equipo</button>
      {open && (
        <Modal label="Administración del equipo" size="full" onClose={() => setOpen(false)}>
          <TeamWorkspace users={users} admin={admin} onClose={() => setOpen(false)} />
        </Modal>
      )}
    </div>
  );
}
