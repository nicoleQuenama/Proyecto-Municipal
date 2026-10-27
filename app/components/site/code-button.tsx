"use client";

import { hasPermission, useAuth } from "../auth/auth-context";
import { CodeIcon } from "../viewport/icons";
import { useHandleSize } from "../viewport/use-handle-size";

interface CodeButtonProps {
  label: string;
  onOpen: () => void;
  /** Posición del botón sobre lo seleccionado. */
  className: string;
}

/** El icono ‹› sobre una sección o elemento seleccionado: abre su código en el editor. */
export function CodeButton({ label, onOpen, className }: CodeButtonProps) {
  const size = useHandleSize();
  const { currentUser } = useAuth();
  // El acceso al código se decide aquí: todos los botones ‹› de la app pasan por este componente.
  if (!hasPermission(currentUser, "editCode")) return null;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      className={`z-20 flex items-center justify-center rounded-full bg-accent text-white shadow hover:opacity-90 ${className}`}
      style={size}
    >
      <CodeIcon />
    </button>
  );
}
