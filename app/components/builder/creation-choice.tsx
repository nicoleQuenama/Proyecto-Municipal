"use client";

import { Modal } from "../ui/modal";

export function CreationChoice({ onCanvas, onCode, onClose, canCode }: {
  onCanvas: () => void; onCode: () => void; onClose: () => void; canCode: boolean;
}) {
  return (
    <Modal label="Elegir cómo crear" size="md" onClose={onClose}>
      <div className="flex flex-col gap-4 bg-panel p-6 text-ink">
        <div><h2 className="text-lg font-semibold">¿Cómo quieres crear?</h2><p className="mt-1 text-xs text-ink-dim">Elige el tipo de componente que quieres reutilizar.</p></div>
        <button type="button" onClick={onCanvas} className="rounded-xl border border-line p-4 text-left hover:border-accent hover:bg-hover cursor-pointer">
          <strong className="block text-sm">Lienzo visual</strong><span className="text-xs text-ink-dim">Diseña y reutiliza elementos visuales.</span>
        </button>
        <button type="button" disabled={!canCode} onClick={onCode} className="rounded-xl border border-line p-4 text-left hover:border-accent hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
          <strong className="block text-sm">Editor de código</strong><span className="text-xs text-ink-dim">Crea un bloque HTML, CSS y JavaScript compartido.</span>
          {!canCode && <span className="block pt-1 text-[11px] text-ink-dim">Tu cuenta no tiene permiso para editar código.</span>}
        </button>
        <button type="button" onClick={onClose} className="self-end rounded-md px-3 py-2 text-xs text-ink-dim hover:bg-hover cursor-pointer">Cancelar</button>
      </div>
    </Modal>
  );
}
