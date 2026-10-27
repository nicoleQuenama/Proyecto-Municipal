"use client";

import { hasPermission } from "./auth-context";
import { UserForm } from "./user-form";
import { UserList } from "./user-list";
import { useUsers } from "./use-users";

export function UserManagement() {
  const users = useUsers();
  if (!hasPermission(users.currentUser, "manageUsers")) return null;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[10px] font-semibold tracking-wider text-ink-dim uppercase">Equipo</p>
        <p className="mt-1 text-sm font-semibold text-ink">Gestionar usuarios</p>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-dim">
          Crea cuentas con su correo y contraseña, y asigna el nivel de acceso de cada persona.
        </p>
      </div>

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
        onSubmit={users.submit}
      />

      <UserList
        users={users.users}
        currentUserId={users.currentUser?.id}
        loading={users.loading}
        removingId={users.removingId}
        onRemove={users.remove}
      />
    </div>
  );
}
