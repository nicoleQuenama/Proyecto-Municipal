"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { LockIcon } from "../components/viewport/icons";
import { useToast } from "../components/ui/toast";
import { PRIMARY_BUTTON } from "../components/ui/ui-classes";
import { confirmReset } from "../components/auth/auth-api";
import { PasswordField } from "../components/auth/password-field";
import { PasswordRequirements } from "../components/auth/password-requirements";
import { passwordReady } from "../components/auth/password-rules";

// Formulario que consume el token del enlace y guarda la contraseña nueva.
export function ResetPasswordForm({ token }: { token: string }) {
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!passwordReady(password)) return toast.error("La contraseña no es segura, debe tener mayusculas, numeros, simbolos.");
    if (password !== confirm) return toast.error("Las contraseñas no coinciden.");

    setPending(true);
    try {
      await confirmReset(token, password);
      setDone(true);
      toast.success("Contraseña actualizada.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo cambiar la contraseña.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Crea una contraseña nueva</h2>
        <p className="mt-2 text-sm text-ink-dim">Elige una contraseña segura para volver a entrar a tu cuenta.</p>
      </div>

      {!token ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          Falta el token. Abre el enlace que llegó a tu correo o pide uno nuevo desde el inicio de sesión.
        </p>
      ) : done ? (
        <div className="flex flex-col gap-4">
          <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-300">
            Tu contraseña se actualizó. Las demás sesiones abiertas se cerraron por seguridad.
          </p>
          <Link href="/" className={`${PRIMARY_BUTTON} flex items-center justify-center`}>
            Ir a iniciar sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <PasswordField
            label="Contraseña nueva"
            icon={<LockIcon />}
            value={password}
            autoComplete="new-password"
            onChange={setPassword}
          />
          <PasswordField
            label="Confirmar contraseña"
            icon={<LockIcon />}
            value={confirm}
            autoComplete="new-password"
            onChange={setConfirm}
          />

          <PasswordRequirements value={password} />

          {error && (
            <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}

          <button type="submit" disabled={pending} className={`${PRIMARY_BUTTON} h-11 cursor-pointer`}>
            {pending ? "Guardando…" : "Guardar contraseña"}
          </button>
        </form>
      )}
    </div>
  );
}
