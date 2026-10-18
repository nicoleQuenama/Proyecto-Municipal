"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  label: string;
  size?: "md" | "lg" | "xl" | "full";
  onClose: () => void;
  children: ReactNode;
}

/**
 * Modal basado en <dialog> nativo: el navegador aporta el foco atrapado,
 * el cierre con Esc y el fondo (::backdrop). Se monta solo mientras está abierto.
 */
const SIZES = {
  md: "mt-[10vh] max-w-lg",
  lg: "mt-[10vh] max-w-4xl",
  xl: "mt-[10vh] max-w-6xl",
  full: "mt-[2vh] h-[96vh] w-[98vw] max-w-none",
} as const;

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
      className={`mx-auto mb-auto w-full ${SIZES[size]} overflow-hidden rounded-xl border border-line bg-panel p-0 text-ink shadow-2xl backdrop:bg-black/50`}
    >
      {children}
    </dialog>
  );
}
