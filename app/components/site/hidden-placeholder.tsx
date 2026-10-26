"use client";

import { VisibilityEye } from "./visibility-eye";

interface HiddenPlaceholderProps {
  /** Qué está oculto: «Sección oculta · Barra de navegación». */
  label: string;
  onShow: () => void;
  /** Elimina lo oculto de verdad, sin dejar rastro. */
  onDelete?: () => void;
  /** Para que el lienzo pueda llevar hasta aquí (comando «/navegar» o búsqueda). */
  dataBlockId?: string;
}

/** Lo que se ve en el editor (nunca en la página publicada) en lugar de algo oculto: una tira discreta con el ojo y «eliminar». */
export function HiddenPlaceholder({ label, onShow, onDelete, dataBlockId }: HiddenPlaceholderProps) {
  return (
    <div
      data-block-id={dataBlockId}
      className="flex w-fit items-center gap-1.5 rounded-md border border-dashed border-neutral-300 py-0.5 pr-2 pl-0.5 text-[11px] text-neutral-400 opacity-70 hover:opacity-100"
    >
      <VisibilityEye hidden label={label} onToggle={onShow} className="flex shrink-0" />
      {label}
      {onDelete && (
        <button
          type="button"
          aria-label={`Eliminar definitivamente: ${label}`}
          title="Eliminar definitivamente"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded px-1 text-neutral-500 hover:bg-red-500/15 hover:text-red-500"
        >
          Eliminar
        </button>
      )}
    </div>
  );
}
