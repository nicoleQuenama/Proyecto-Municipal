"use client";

import { useEffect, useState } from "react";
import type { Access } from "../auth/access";
import { fetchUsers, removeUser, saveAccess } from "../auth/auth-api";
import { hasPermission, useAuth, useAuthDispatch } from "../auth/auth-context";
import { ROLE_LABELS, type User } from "../auth/types";
import { Avatar } from "../ui/avatar";
import { AccessEditor } from "./access-editor";
import { describeAccess } from "./access-presets";
import { InviteAccountForm } from "./invite-account-form";

interface PersonRowProps {
  user: User;
  open: boolean;
  saving: boolean;
  onToggle: () => void;
  onSave: (access: Access) => void;
  onRemove: () => void;
}

function PersonRow({ user, open, saving, onToggle, onSave, onRemove }: PersonRowProps) {
  const { where, limits, expiry, expired } = describeAccess(user);
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-line p-3">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium">
            {user.name} <span className="font-normal text-ink-dim">· {ROLE_LABELS[user.role]}</span>
          </p>
          <p className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-ink-dim">
            <span className="text-ink">{where}</span>
            {limits.map((limit) => (
              <span key={limit}>· {limit}</span>
            ))}
            <span className={expired ? "font-medium text-red-400" : ""}>· {expiry}</span>
          </p>
        </div>
        <button type="button" aria-expanded={open} onClick={onToggle} className="h-8 shrink-0 rounded-md border border-line px-3 text-xs hover:bg-hover">
          {open ? "Cerrar" : expired ? "Renovar acceso" : "Cambiar acceso"}
        </button>
        <button
          type="button"
          title={`Quitar a ${user.name} del proyecto ahora mismo`}
          aria-label={`Quitar a ${user.name}`}
          onClick={onRemove}
          className="h-8 shrink-0 rounded-md px-2 text-xs text-ink-dim hover:bg-hover hover:text-red-400"
        >
          Quitar
        </button>
      </div>
      {open && <AccessEditor user={user} saving={saving} onSave={onSave} onCancel={onToggle} />}
    </li>
  );
}

/** Tu grupo de trabajo: las personas que invitaste y lo que puede hacer cada una (el superadministrador ve a todas). */
export function AccessSection() {
  const { currentUser, users } = useAuth();
  const dispatch = useAuthDispatch();
  const [openId, setOpenId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const allowed = hasPermission(currentUser, "invite");

  useEffect(() => {
    if (allowed) fetchUsers().then((list) => dispatch({ type: "users/set", users: list })).catch(() => {});
  }, [allowed, dispatch]);

  if (!allowed) {
    return <p className="rounded-lg bg-hover p-4 text-xs text-ink-dim">Quien te invitó no te permite invitar a otras personas.</p>;
  }
  const people = users.filter((user) => user.id !== currentUser?.id && user.role !== "superadmin");

  const run = async (task: () => Promise<void>, fallback: string) => {
    setSaving(true);
    setError("");
    try {
      await task();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : fallback);
    } finally {
      setSaving(false);
    }
  };

  const save = (user: User, access: Access) =>
    run(async () => {
      const saved = await saveAccess(user.id, access);
      dispatch({ type: "user/access", id: user.id, access: saved.access ?? access });
      setOpenId(null);
    }, "No se pudo guardar el acceso.");

  const remove = (user: User) =>
    run(async () => {
      await removeUser(user.id);
      dispatch({ type: "user/remove", id: user.id });
    }, "No se pudo quitar a la persona.");

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold">{currentUser?.role === "superadmin" ? "Personas con acceso" : "Tu grupo de trabajo"}</h3>
        <p className="text-xs text-ink-dim">
          Invita a quien necesites y decide hasta dónde llega cada persona y por cuánto tiempo. Nadie puede recibir más permisos que quien lo invita.
        </p>
      </div>

      {people.length === 0 && (
        <p className="rounded-lg border border-dashed border-line p-4 text-center text-xs text-ink-dim">
          Todavía no invitaste a nadie. Agrega a la primera persona aquí abajo.
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {people.map((user) => (
          <PersonRow
            key={user.id}
            user={user}
            open={openId === user.id}
            saving={saving}
            onToggle={() => setOpenId(openId === user.id ? null : user.id)}
            onSave={(access) => save(user, access)}
            onRemove={() => remove(user)}
          />
        ))}
      </ul>
      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}

      <InviteAccountForm
        onCreated={(user) => {
          dispatch({ type: "user/create", user });
          setOpenId(user.id);
        }}
      />
    </section>
  );
}
