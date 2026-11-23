"use client";

import { Modal } from "../ui/modal";

/** Pregunta antes de eliminar y, si el código se usa en otro lado, lo dice. */
export function ConfirmDelete({
  title,
  warnings,
  onConfirm,
  onCancel,
}: {
  title: string;
  warnings: string[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal label={title} size="md" onClose={onCancel}>
      <div className="flex flex-col gap-3 p-5">
        <h3 className="text-sm font-semibold">{title}</h3>
        {warnings.length > 0 ? (
          <ul className="flex flex-col gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
            {warnings.map((warning) => (
              <li key={warning} className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 shrink-0 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex justify-end gap-2">
          <button type="button" autoFocus onClick={onCancel} className="rounded-md bg-hover px-3 py-1.5 text-xs hover:bg-line cursor-pointer">
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} className="rounded-md bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-500 cursor-pointer">
            Eliminar
          </button>
        </div>
      </div>
    </Modal>
  );
}
