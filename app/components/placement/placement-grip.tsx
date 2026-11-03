"use client";

import type { PointerEvent } from "react";

interface PlacementGripProps {
  label: string;
  onStart?: (e: PointerEvent<HTMLElement>) => void;
  disabled?: boolean;
  className?: string;
}

/** El asa para mover un elemento de la página a cualquier punto, o a otra página. */
export function PlacementGrip({ label, onStart, disabled = false, className = "" }: PlacementGripProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={disabled ? `${label} está bloqueada` : `Mover ${label}`}
      title={disabled ? `${label} está bloqueada · Desbloquea para mover` : `Arrastra para mover ${label} a cualquier punto o a otra página`}
      onPointerDown={disabled ? undefined : onStart}
      className={`z-30 flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-medium shadow transition-colors ${
        disabled
          ? "cursor-not-allowed bg-zinc-700/80 text-zinc-400 opacity-60 shadow-none"
          : "cursor-grab touch-none bg-sky-600 text-white active:cursor-grabbing hover:bg-sky-500"
      } ${className}`}
    >
      <span aria-hidden>⠿</span> Mover
    </button>
  );
}
