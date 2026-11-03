"use client";

import { CopyButton } from "../export/copy-button";
import { GHOST_BUTTON, LABEL, PANEL_CARD, PRIMARY_BUTTON } from "../ui/ui-classes";

interface ForgotPasswordResultProps {
  username: string;
  password: string;
  onUse: () => void;
  onClose: () => void;
}

/** Resultado de la recuperación: muestra la clave temporal y deja entrar con ella. */
export function ForgotPasswordResult({ username, password, onUse, onClose }: ForgotPasswordResultProps) {
  return (
    <div className="flex flex-col gap-4 p-5">
      <p className="text-xs leading-relaxed text-ink-dim">
        Restablecimos la contraseña de <b className="text-ink">@{username}</b>. Úsala para entrar y cámbiala
        desde tu perfil.
      </p>

      <div className={PANEL_CARD}>
        <p className={LABEL}>Contraseña temporal</p>
        <p className="mt-2 rounded-md border border-dashed border-line bg-panel px-3 py-2 font-mono text-sm text-ink">
          {password}
        </p>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <CopyButton text={password} label="Copiar contraseña" />
        <button type="button" onClick={onUse} className={PRIMARY_BUTTON}>
          Usar e iniciar sesión
        </button>
        <button type="button" onClick={onClose} className={GHOST_BUTTON}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
