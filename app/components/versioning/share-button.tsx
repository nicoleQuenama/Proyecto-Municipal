"use client";

import { useState } from "react";
import { Modal } from "../ui/modal";
import { AccessSection } from "./access-section";
import { InviteForm } from "./invite-form";
import { InviteLink } from "./invite-link";
import { MemberList } from "./member-list";

function ShareDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal label="Compartir el proyecto" size="lg" onClose={onClose}>
      <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">Compartir el proyecto</h2>
          <p className="mt-0.5 text-xs text-ink-dim">Decide quién puede trabajar aquí y qué parte del proyecto puede tocar.</p>
        </div>
        <button type="button" aria-label="Cerrar" onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink">
          ×
        </button>
      </header>

      <div className="flex max-h-[70vh] flex-col gap-6 overflow-y-auto p-5">
        <AccessSection />

        <details className="rounded-xl border border-line">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Invitar por enlace o correo (prototipo)</summary>
          <div className="flex flex-col gap-4 border-t border-line p-4">
            <p className="rounded-md bg-hover px-3 py-2 text-xs text-ink-dim">
              Esta parte funciona solo en este navegador y todavía no envía invitaciones reales. Para dar acceso de verdad, crea la cuenta de la persona en <b>Usuarios</b>.
            </p>
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold">Enlace de invitación</h3>
              <InviteLink />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold">Invitar a alguien</h3>
              <p className="text-xs text-ink-dim">Un Editor puede cambiar el diseño; un Revisor solo revisa y aprueba cambios.</p>
              <InviteForm />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold">Invitados</h3>
              <MemberList />
            </div>
          </div>
        </details>
      </div>
    </Modal>
  );
}

/** Botón «Compartir» que abre su propio diálogo. */
export function ShareButton({ className }: { className: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" title="Dar acceso a otras personas al proyecto" onClick={() => setOpen(true)} className={className}>
        Compartir
      </button>
      {open && <ShareDialog onClose={() => setOpen(false)} />}
    </>
  );
}
