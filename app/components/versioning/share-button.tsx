"use client";

import { useState } from "react";
import { Modal } from "../ui/modal";
import { AccessSection } from "./access-section";

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
        <p className="rounded-md bg-hover px-3 py-2 text-xs text-ink-dim">
          Cada etiqueta resume el acceso de una persona: dónde puede trabajar, hasta cuándo y qué no puede hacer.
        </p>
        <AccessSection />

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
