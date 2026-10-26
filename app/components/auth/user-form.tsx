"use client";

import type { UserRole } from "./types";
import { ROLE_LABELS } from "./types";
import { PlusIcon, ShieldIcon } from "../viewport/icons";
import { UserField } from "./user-field";
import { UserFormMessages } from "./user-form-messages";
import { UserIdentityFields } from "./user-identity-fields";
import { ROLE_OPTIONS } from "./user-ui";

interface UserFormProps {
  name: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  saving: boolean;
  error: string;
  notice: string;
  onName: (value: string) => void;
  onUsername: (value: string) => void;
  onEmail: (value: string) => void;
  onPassword: (value: string) => void;
  onRole: (value: UserRole) => void;
  onSubmit: (event: React.FormEvent) => void;
}

export function UserForm({
  name,
  username,
  email,
  password,
  role,
  saving,
  error,
  notice,
  onName,
  onUsername,
  onEmail,
  onPassword,
  onRole,
  onSubmit,
}: UserFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2.5 rounded-xl border border-line bg-canvas/40 p-3">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-ink-dim uppercase">
        <PlusIcon /> Nuevo usuario
      </p>

      <UserIdentityFields
        name={name}
        username={username}
        email={email}
        onName={onName}
        onUsername={onUsername}
        onEmail={onEmail}
      />

      <label className="flex flex-col gap-1">
        <span className="text-[10px] text-ink-dim">Contraseña</span>
        <input
          type="password"
          value={password}
          onChange={(event) => onPassword(event.target.value)}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          className="h-9 rounded-lg border border-line bg-panel px-2.5 text-xs text-ink outline-none placeholder:text-ink-dim/60 focus:border-accent/60"
        />
      </label>

      <UserField label="Rol" icon={<ShieldIcon />}>
        <select
          value={role}
          onChange={(event) => onRole(event.target.value as UserRole)}
          className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none"
        >
          {ROLE_OPTIONS.map((value) => (
            <option key={value} value={value} className="bg-panel text-ink">
              {ROLE_LABELS[value]}
            </option>
          ))}
        </select>
      </UserField>

      <UserFormMessages error={error} notice={notice} />

      <button
        type="submit"
        disabled={saving}
        className="mt-1 flex h-9 items-center justify-center gap-2 rounded-lg bg-accent text-xs font-semibold text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving && (
          <span aria-hidden className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        )}
        {saving ? "Creando…" : "Crear usuario"}
      </button>
    </form>
  );
}
