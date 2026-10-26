"use client";

import { Modal } from "../ui/modal";
import { LockIcon, MailIcon, ShieldIcon, UserIcon } from "../viewport/icons";
import { Avatar } from "./avatar";
import { hasPermission } from "./auth-context";
import { PERMISSIONS } from "./profile-data";
import { ROLE_BADGE } from "./user-ui";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type User } from "./types";

export function ProfileDialog({ user, onClose }: { user: User; onClose: () => void }) {
  return (
    <Modal label="Perfil de usuario" size="md" onClose={onClose}>
      <div className="flex items-center gap-4 border-b border-line bg-canvas/40 p-6">
        <Avatar user={user} large />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-ink">{user.name}</p>
          <p className="truncate text-xs text-ink-dim">@{user.username}</p>
        </div>
        <span
          className={`ml-auto shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase ${ROLE_BADGE[user.role]}`}
        >
          {ROLE_LABELS[user.role]}
        </span>
      </div>

      <div className="grid gap-4 p-6 sm:grid-cols-2">
        <Field icon={<UserIcon />} label="Usuario" value={user.username} />
        <Field icon={<MailIcon />} label="Correo" value={user.email} />
        <Field icon={<ShieldIcon />} label="Rol" value={ROLE_LABELS[user.role]} hint={ROLE_DESCRIPTIONS[user.role]} />
        <Field icon={<LockIcon />} label="Nombre completo" value={user.name} />
      </div>

      <div className="flex justify-end border-t border-line bg-canvas/30 px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="h-9 rounded-lg border border-line px-4 text-xs font-medium text-ink transition-colors hover:bg-hover"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
}

function Field({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-canvas/40 p-3">
      <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-ink-dim uppercase">
        {icon} {label}
      </p>
      <p className="truncate text-sm text-ink">{value}</p>
      {hint && <p className="mt-1 text-[11px] leading-relaxed text-ink-dim">{hint}</p>}
    </div>
  );
}
