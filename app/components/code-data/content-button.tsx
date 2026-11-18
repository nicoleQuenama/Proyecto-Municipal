"use client";

import { useState } from "react";
import { DataModal } from "./data-modal";
import type { DataTarget } from "./data-target";
import { useCodeData } from "./use-code-data";

interface ContentButtonProps {
  target: DataTarget;
  /** Dónde y cómo se coloca el botón: sobre el bloque en el lienzo, o en la barra del editor. */
  className: string;
}

/** El botón «Contenido»: solo aparece si el código tiene datos que el lienzo puede editar. */
export function ContentButton({ target, className }: ContentButtonProps) {
  const { sets } = useCodeData(target);
  const [open, setOpen] = useState(false);
  if (sets.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className={className}
      >
        Contenido
      </button>
      {open && <DataModal target={target} onClose={() => setOpen(false)} />}
    </>
  );
}
