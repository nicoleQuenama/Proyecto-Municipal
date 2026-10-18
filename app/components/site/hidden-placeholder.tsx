"use client";

import { VisibilityEye } from "./visibility-eye";

interface HiddenPlaceholderProps {
  /** Qué está oculto: «Sección oculta · Barra de navegación». */
  label: string;
  onShow: () => void;
  /** Para que el lienzo pueda llevar hasta aquí (comando «/navegar» o búsqueda). */
  dataBlockId?: string;
}

/** Lo que se ve en el editor en lugar de algo oculto: una tira discreta con el ojo para mostrarlo. */
export function HiddenPlaceholder({ label, onShow, dataBlockId }: HiddenPlaceholderProps) {
  return (
    <div
      data-block-id={dataBlockId}
      className="flex w-fit items-center gap-2 rounded-md border border-dashed border-neutral-400 py-1 pr-3 pl-1 text-xs text-neutral-500"
    >
      <VisibilityEye hidden label={label} onToggle={onShow} className="flex shrink-0" />
      {label}
    </div>
  );
}
