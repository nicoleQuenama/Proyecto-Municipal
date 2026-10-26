"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { overlayStyle, panelStyle } from "./modal-options";
import type { ModalOptions } from "./types";

interface ModalViewProps {
  label: string;
  options: ModalOptions;
  onClose: () => void;
  children: ReactNode;
}

/**
 * La ventana superpuesta. Usa <dialog> nativo: el navegador atrapa el foco dentro, cierra con Esc
 * y devuelve el foco a donde estaba. El velo es el propio <dialog>, a pantalla completa.
 */
export function ModalView({ label, options, onClose, children }: ModalViewProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      // Lo que ocurre en la ventana no debe llegar al lienzo del editor (deseleccionar, arrastrar…).
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => options.closeOnBackdrop && e.target === e.currentTarget && onClose()}
      className="modal-overlay fixed inset-0 m-0 h-screen max-h-none w-screen max-w-none border-0 bg-transparent p-0 backdrop:bg-transparent open:flex"
      style={overlayStyle(options)}
    >
      <div className="modal-panel relative overflow-auto bg-white text-neutral-900 shadow-2xl" style={panelStyle(options)}>
        {options.showClose && (
          <button
            type="button"
            aria-label="Cerrar la ventana"
            onClick={onClose}
            className="sticky top-3 z-20 float-right mr-3 mb-[-2.5rem] flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-lg text-white hover:bg-black"
          >
            ×
          </button>
        )}
        {children}
      </div>
    </dialog>
  );
}
