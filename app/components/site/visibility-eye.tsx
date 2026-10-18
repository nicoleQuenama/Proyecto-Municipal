"use client";

import type { CSSProperties } from "react";
import { EyeIcon, EyeOffIcon } from "../viewport/icons";
import { HANDLE_SIZE, useHandleSize } from "../viewport/use-handle-size";

interface VisibilityEyeProps {
  /** Lo que se está viendo ahora: con `true` el ojo está tachado y al pulsarlo se muestra. */
  hidden: boolean;
  label: string;
  onToggle: () => void;
  /** Posición y visibilidad; el tamaño lo pone el componente. */
  className: string;
  style?: CSSProperties;
  /** `false` fuera del lienzo con zoom (p. ej. en la etiqueta de una página): tamaño fijo. */
  zoomed?: boolean;
}

/** El ojo para ocultar o volver a mostrar lo que se señala. Mide igual con cualquier zoom. */
export function VisibilityEye({ hidden, label, onToggle, className, style, zoomed = true }: VisibilityEyeProps) {
  const handleSize = useHandleSize();
  const size = zoomed ? handleSize : { width: HANDLE_SIZE, height: HANDLE_SIZE };

  return (
    <button
      type="button"
      aria-label={`${hidden ? "Mostrar" : "Ocultar"} ${label}`}
      title={hidden ? `Mostrar ${label}` : `Ocultar ${label}`}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`z-20 items-center justify-center rounded-full border border-sky-500 shadow ${
        hidden ? "bg-sky-500 text-white" : "bg-white text-sky-600"
      } ${className}`}
      style={{ ...size, ...style }}
    >
      {hidden ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );
}
