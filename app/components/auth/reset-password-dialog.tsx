"use client";

import { Modal } from "../ui/modal";
import { CopyButton } from "../export/copy-button";
import { GHOST_BUTTON, LABEL, PANEL_CARD } from "../ui/ui-classes";

interface ResetPasswordDialogProps {
  name: string;
  username: string;
  password: string;
  onClose: () => void;
}

/** Muestra la contraseña temporal de forma clara y fácil de copiar, sin `alert` del navegador. */
export function ResetPasswordDialog({ name, username, password, onClose }: ResetPasswordDialogProps) {
  return (
    <Modal label="Contraseña restablecida" size="md" onClose={onClose}>
      <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Contraseña restablecida</h2>
          <p className="mt-0.5 text-xs text-ink-dim">
            Se generó una contraseña temporal para {name} (@{username}).
          </p>
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

      <div className="flex flex-col gap-4 p-5">
        <p className="text-xs leading-relaxed text-ink-dim">
          Compártela por un medio seguro. Al entrar, la persona podrá cambiarla desde su perfil.
          No volverás a verla después de cerrar esta ventana.
        </p>

        <div className={PANEL_CARD}>
          <p className={LABEL}>Contraseña temporal</p>
          <p className="mt-2 rounded-md border border-dashed border-line bg-panel px-3 py-2 font-mono text-sm text-ink">
            {password}
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <CopyButton text={password} label="Copiar contraseña" />
          <button type="button" onClick={onClose} className={GHOST_BUTTON}>
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
