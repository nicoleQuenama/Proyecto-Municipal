"use client";

import { useState } from "react";
import { resetPassword } from "./auth-api";
import { UserRow } from "./user-row";
import type { User } from "./types";
import { useToast } from "../ui/toast";

interface UserListProps {
  users: User[];
  currentUserId: string | undefined;
  loading: boolean;
  removingId: string | null;
  onRemove: (id: string, username: string) => void;
}

/** Lista de cuentas y sus acciones. La contraseña temporal se envía por correo, nunca se muestra en pantalla. */
export function UserList({ users, currentUserId, loading, removingId, onRemove }: UserListProps) {
  const toast = useToast();
  const [resetting, setResetting] = useState<string | null>(null);

  const doReset = async (user: User) => {
    setResetting(user.id);
    try {
      await resetPassword(user.id);
      toast.success(`Contraseña restablecida. Se envió a su correo.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo restablecer la contraseña.");
    } finally {
      setResetting(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold tracking-wider text-ink-dim uppercase">
          Usuarios · {users.length}
        </p>
        {loading && <span className="text-[10px] text-ink-dim">Cargando…</span>}
      </div>

      {!loading && users.length === 0 && (
        <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-[11px] text-ink-dim">
          Todavía no hay usuarios.
        </p>
      )}

      {users.map((user) => (
        <UserRow
          key={user.id}
          user={user}
          isCurrent={user.id === currentUserId}
          resetting={resetting === user.id}
          removing={removingId === user.id}
          onReset={() => doReset(user)}
          onRemove={() => onRemove(user.id, user.username)}
        />
      ))}
    </div>
  );
}
