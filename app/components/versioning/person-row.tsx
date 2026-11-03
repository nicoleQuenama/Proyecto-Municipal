"use client";

import type { Access } from "../auth/access";
import { ROLE_LABELS, type User } from "../auth/types";
import { Avatar } from "../ui/avatar";
import { AccessEditor } from "./access-editor";
import { AccessSummary } from "./access-summary";
import { describeAccess } from "./access-presets";

interface PersonRowProps {
  user: User;
  open: boolean;
  saving: boolean;
  onToggle: () => void;
  onSave: (access: Access) => void;
  onRemove: () => void;
}

/** Una persona con acceso: quién es, qué puede hacer y cómo cambiar o quitar su acceso. */
export function PersonRow({ user, open, saving, onToggle, onSave, onRemove }: PersonRowProps) {
  const { expired } = describeAccess(user);

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-line p-3">
      <div className="flex items-start gap-3">
        <Avatar name={user.name} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="truncate text-[13px] font-medium text-ink">
            {user.name} <span className="font-normal text-ink-dim">· {ROLE_LABELS[user.role]}</span>
          </p>
          <AccessSummary user={user} />
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className="h-8 shrink-0 rounded-md border border-line px-3 text-xs text-ink hover:bg-hover"
        >
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
