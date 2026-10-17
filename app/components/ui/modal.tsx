"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  label: string;
  size?: "md" | "lg" | "xl";
  onClose: () => void;
  children: ReactNode;
}

/**
 * Modal basado en <dialog> nativo: el navegador aporta el foco atrapado,
 * el cierre con Esc y el fondo (::backdrop). Se monta solo mientras está abierto.
 */
const SIZES = { md: "max-w-lg", lg: "max-w-4xl", xl: "max-w-6xl" } as const;

export function Modal({ label, size = "md", onClose, children }: ModalProps) {
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
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={`mx-auto mt-[10vh] mb-auto w-full ${SIZES[size]} overflow-hidden rounded-xl border border-line bg-panel p-0 text-ink shadow-2xl backdrop:bg-black/50`}
    >
      {children}
    </dialog>
  );
}
