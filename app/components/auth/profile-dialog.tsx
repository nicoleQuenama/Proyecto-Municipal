"use client";

import { useState } from "react";
import { Modal } from "../ui/modal";
import { LockIcon, MailIcon, ShieldIcon, UserIcon } from "../viewport/icons";
import { Avatar } from "./avatar";
import { ROLE_BADGE } from "./user-ui";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type User } from "./types";
import { changePassword } from "./auth-api";

export function ProfileDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const [showChange, setShowChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError("");
    setOk("");
    if (newPassword !== confirm) return setError("Las contraseñas no coinciden.");
    if (newPassword.length < 8) return setError("Mínimo 8 caracteres.");
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setOk("Contraseña actualizada.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setTimeout(() => setShowChange(false), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

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

      {!showChange ? (
        <div className="px-6 pb-4">
          <button
            type="button"
            onClick={() => setShowChange(true)}
            className="h-9 rounded-lg border border-line px-4 text-xs font-medium text-ink transition-colors hover:bg-hover"
          >
            Cambiar contraseña
          </button>
        </div>
      ) : (
        <div className="space-y-3 px-6 pb-4">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Contraseña actual"
            className="h-9 w-full rounded-lg border border-line bg-canvas px-3 text-xs text-ink"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nueva contraseña"
            className="h-9 w-full rounded-lg border border-line bg-canvas px-3 text-xs text-ink"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirmar nueva contraseña"
            className="h-9 w-full rounded-lg border border-line bg-canvas px-3 text-xs text-ink"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          {ok && <p className="text-xs text-green-400">{ok}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="h-9 rounded-lg bg-accent px-4 text-xs font-medium text-white disabled:opacity-50"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setShowChange(false)}
              className="h-9 rounded-lg border border-line px-4 text-xs text-ink hover:bg-hover"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

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
