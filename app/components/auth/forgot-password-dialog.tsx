"use client";

import { useState, type FormEvent } from "react";
import { FIELD, GHOST_BUTTON, LABEL, PRIMARY_BUTTON } from "../ui/ui-classes";
import { Modal } from "../ui/modal";
import { forgotPassword } from "./auth-api";
import { ForgotPasswordResult } from "./forgot-password-result";

interface ForgotPasswordDialogProps {
  onClose: () => void;
  /** Rellena el formulario de acceso con la clave temporal. */
  onRecovered: (username: string, password: string) => void;
}

/** Recuperación simulada desde el login: sin correo, muestra la clave nueva en el modal. */
export function ForgotPasswordDialog({ onClose, onRecovered }: ForgotPasswordDialogProps) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      setTempPassword(await forgotPassword(username));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo restablecer la contraseña.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal label="Recuperar contraseña" size="md" onClose={onClose}>
      <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Recuperar contraseña</h2>
          <p className="mt-0.5 text-xs text-ink-dim">Escribe tu usuario y te mostraremos una contraseña temporal.</p>
        </div>
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink"
        >
          ×
        </button>
      </header>
      {tempPassword ? (
        <ForgotPasswordResult
          username={username.trim()}
          password={tempPassword}
          onUse={() => onRecovered(username.trim(), tempPassword)}
          onClose={onClose}
        />
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3 p-5">
          <p className="rounded-md bg-hover px-3 py-2 text-xs text-ink-dim">
            Modo demostración: no hay correo vinculado, así que la nueva contraseña se muestra aquí mismo.
          </p>
          <label className="flex flex-col gap-1">
            <span className={LABEL}>Usuario</span>
            <input
              aria-label="Usuario"
              value={username}
              autoComplete="username"
              onChange={(event) => { setUsername(event.target.value); setError(""); }}
              className={FIELD}
            />
          </label>
          {error && (
            <p role="alert" className="text-xs text-red-400">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className={GHOST_BUTTON}>
              Cancelar
            </button>
            <button type="submit" disabled={pending || !username.trim()} className={PRIMARY_BUTTON}>
              {pending ? "Restableciendo…" : "Restablecer"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
