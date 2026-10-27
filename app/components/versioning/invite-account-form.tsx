"use client";

import { useState, type FormEvent } from "react";
import { createUser } from "../auth/auth-api";
import { useAuth } from "../auth/auth-context";
import { ROLE_LABELS, type User, type UserRole } from "../auth/types";

const FIELD = "h-9 min-w-0 rounded-md border border-line bg-canvas px-3 text-[13px] outline-none placeholder:text-ink-dim focus:border-accent";

/** Qué roles puede dar cada uno: nadie invita a alguien con más rol que el suyo. */
const GIVES: Record<UserRole, UserRole[]> = { superadmin: ["dev", "designer"], dev: ["dev", "designer"], designer: ["designer"] };

/** Crear la cuenta de una persona nueva para el grupo de trabajo. Empieza solo mirando, por una semana. */
export function InviteAccountForm({ onCreated }: { onCreated: (user: User) => void }) {
  const { currentUser } = useAuth();
  const roles = GIVES[currentUser?.role ?? "designer"];
  const [values, setValues] = useState({ name: "", email: "", username: "", password: "" });
  const [role, setRole] = useState<UserRole>(roles[roles.length - 1]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [key]: e.target.value });
    setError("");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      onCreated(await createUser({ ...values, role }));
      setValues({ name: "", email: "", username: "", password: "" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo crear la cuenta.");
    } finally {
      setSaving(false);
    }
  };

  const ready = Object.values(values).every((v) => v.trim());

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border border-dashed border-line p-4">
      <div>
        <h4 className="text-[13px] font-semibold">Agregar a una persona a tu grupo</h4>
        <p className="text-[11px] text-ink-dim">
          Empezará solo mirando y con acceso por 1 semana. Después le das las secciones y los permisos que quieras.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input aria-label="Nombre" placeholder="Nombre" value={values.name} onChange={set("name")} className={FIELD} />
        <input aria-label="Correo" type="email" placeholder="Correo" value={values.email} onChange={set("email")} className={FIELD} />
        <input aria-label="Usuario" placeholder="Usuario" autoComplete="off" value={values.username} onChange={set("username")} className={FIELD} />
        <input aria-label="Contraseña inicial" type="password" placeholder="Contraseña (mín. 8)" autoComplete="new-password" value={values.password} onChange={set("password")} className={FIELD} />
      </div>
      <div className="flex items-center gap-2">
        <select aria-label="Rol" value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={`${FIELD} [&>option]:bg-panel`}>
          {roles.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <button type="submit" disabled={!ready || saving} className="h-9 rounded-md bg-accent px-4 text-xs font-medium text-white disabled:opacity-40">
          {saving ? "Creando…" : "Crear cuenta"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}
