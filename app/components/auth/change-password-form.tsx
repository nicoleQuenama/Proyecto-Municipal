"use client";

import { useState, type FormEvent } from "react";
import { LockIcon } from "../viewport/icons";
import { useToast } from "../ui/toast";
import { PRIMARY_BUTTON } from "../ui/ui-classes";
import { changePassword } from "./auth-api";
import { PasswordField } from "./password-field";
import { PasswordRequirements } from "./password-requirements";
import { passwordReady } from "./password-rules";

/** Cambio de contraseña con el mismo lenguaje visual del login. */
export function ChangePasswordForm({ onCancel, onDone }: { onCancel: () => void; onDone: () => void }) {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!passwordReady(next)) {
      toast.error("La contraseña nueva todavía no cumple los requisitos.");
      return;
    }
    if (next !== confirm) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    setSaving(true);
    try {
      await changePassword(current, next);
      toast.success("Contraseña actualizada. Cerramos las demás sesiones.");
      onDone();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo cambiar la contraseña.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 px-6 pb-6">
      <p className="text-xs leading-relaxed text-ink-dim">
        Escribe tu contraseña actual y elige una nueva. Al guardar, las demás sesiones abiertas se cerrarán.
      </p>

      <PasswordField label="Contraseña actual" icon={<LockIcon />} value={current} autoComplete="current-password" onChange={setCurrent} />
      <PasswordField label="Contraseña nueva" icon={<LockIcon />} value={next} autoComplete="new-password" onChange={setNext} />
      <PasswordField label="Confirmar contraseña nueva" icon={<LockIcon />} value={confirm} autoComplete="new-password" onChange={setConfirm} />

      <PasswordRequirements value={next} />

      {error && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-10 rounded-xl border border-line px-4 text-xs font-medium text-ink hover:bg-hover cursor-pointer">
          Cancelar
        </button>
        <button type="submit" disabled={saving || !current || !next || !confirm} className={`${PRIMARY_BUTTON} cursor-pointer`}>
          {saving ? "Guardando…" : "Guardar contraseña"}
        </button>
      </div>
    </form>
  );
}
