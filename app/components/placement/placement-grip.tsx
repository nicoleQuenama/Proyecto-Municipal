"use client";

import type { PointerEvent } from "react";

interface PlacementGripProps {
  label: string;
  onStart: (e: PointerEvent<HTMLElement>) => void;
  className?: string;
}

/** El asa para mover un elemento de la página a cualquier punto, o a otra página. */
export function PlacementGrip({ label, onStart, className = "" }: PlacementGripProps) {
  return (
    <button
      type="button"
      aria-label={`Mover ${label}`}
      title={`Arrastra para mover ${label} a cualquier punto o a otra página`}
      onPointerDown={onStart}
      className={`z-30 flex h-6 cursor-grab touch-none items-center gap-1 rounded-full bg-sky-600 px-2 text-[11px] font-medium text-white shadow active:cursor-grabbing ${className}`}
    >
      <span aria-hidden>⠿</span> Mover
    </button>
  );
}
