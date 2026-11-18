"use client";

import { hasPermission, useAuth } from "../auth/auth-context";
import { useWorkbench } from "../workbench/workbench-context";
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
      className={`z-20 flex items-center justify-center rounded-full bg-accent text-white shadow hover:opacity-90 ${className} cursor-pointer`}
      style={size}
    >
      <CodeIcon />
    </button>
  );
}

/**
 * El botón ‹› en la fila de etiqueta de una página: abre su código en el editor. Es la vía de una página
 * nueva, que no tiene secciones donde colgar el ‹› de arriba. Mide lo que los demás botones de la fila,
 * así que no pasa por `useHandleSize`, que es para los iconos sobre el lienzo (allí mandan el zoom).
 */
export function PageCodeButton({ pageId }: { pageId: string }) {
  const { currentUser } = useAuth();
  const { openFile } = useWorkbench();
  if (!hasPermission(currentUser, "editCode")) return null;

  return (
    <button
      type="button"
      aria-label="Abrir el código de la página en el editor"
      title="Abrir el código de la página (Ctrl+E)"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        openFile({ kind: "page-js", pageId });
      }}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-ink-dim hover:bg-hover hover:text-ink transition-colors cursor-pointer"
    >
      <CodeIcon />
    </button>
  );
}
