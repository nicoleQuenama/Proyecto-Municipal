"use client";

import { useState, type FormEvent } from "react";
import { MailIcon, UserIcon } from "../viewport/icons";
import { GHOST_BUTTON, PRIMARY_BUTTON } from "../ui/ui-classes";
import { Modal } from "../ui/modal";
import { forgotPassword } from "./auth-api";
import { FloatingField } from "./login-field";

interface ForgotPasswordDialogProps {
  onClose: () => void;
}

/** Pide usuario + correo y dispara el enlace de restablecimiento con Resend. */
export function ForgotPasswordDialog({ onClose }: ForgotPasswordDialogProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await forgotPassword(username, email);
      setSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo enviar el enlace.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal label="Recuperar contraseña" size="md" onClose={onClose}>
      <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Recuperar contraseña</h2>
          <p className="mt-0.5 text-xs text-ink-dim">Confirma tu usuario y correo para enviarte un enlace.</p>
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

      {sent ? (
        <div className="flex flex-col gap-4 p-5">
          <p className="text-xs leading-relaxed text-ink-dim">
            Si el usuario <b className="text-ink">@{username.trim()}</b> y el correo{" "}
            <b className="text-ink">{email.trim()}</b> coinciden con una cuenta, recibirás un enlace. Revisa también
            la carpeta de spam. Vence en 30 minutos.
          </p>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className={PRIMARY_BUTTON}>
              Entendido
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3 p-5">
          <FloatingField
            label="Usuario"
            icon={<UserIcon />}
            value={username}
            autoComplete="username"
            onChange={(value) => { setUsername(value); setError(""); }}
          />
          <FloatingField
            label="Correo"
            icon={<MailIcon />}
            value={email}
            autoComplete="email"
            onChange={(value) => { setEmail(value); setError(""); }}
          />
          {error && (
            <p role="alert" className="text-xs text-red-400">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className={GHOST_BUTTON}>
              Cancelar
            </button>
            <button type="submit" disabled={pending || !username.trim() || !email.trim()} className={PRIMARY_BUTTON}>
              {pending ? "Enviando…" : "Enviar enlace"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
