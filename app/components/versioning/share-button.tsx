"use client";

import { useState } from "react";
import { Modal } from "../ui/modal";
import { InviteForm } from "./invite-form";
import { InviteLink } from "./invite-link";
import { MemberList } from "./member-list";

function ShareDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal label="Compartir el proyecto" onClose={onClose}>
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold">Compartir el proyecto</h2>
        <button type="button" aria-label="Cerrar" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink">×</button>
      </header>
      <div className="flex flex-col gap-4 p-4">
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold">Enlace de invitación</h3>
          <InviteLink />
        </section>
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold">Invitar a alguien</h3>
          <p className="text-xs text-ink-dim">Un Editor puede cambiar el diseño; un Revisor solo revisa y aprueba cambios.</p>
          <InviteForm />
        </section>
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold">Personas del proyecto</h3>
          <MemberList />
        </section>
        <p className="rounded-md bg-hover px-3 py-2 text-xs text-ink-dim">
          Esto es un prototipo: la lista y el enlace funcionan solo en este navegador y todavía no se sincronizan con otras personas ni dispositivos.
        </p>
      </div>
    </Modal>
  );
}

/** Botón «Compartir» que abre su propio diálogo. */
export function ShareButton({ className }: { className: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" title="Invitar a otras personas al proyecto" onClick={() => setOpen(true)} className={className}>
        Compartir
      </button>
      {open && <ShareDialog onClose={() => setOpen(false)} />}
    </>
  );
}
