"use client";

import { useRef, type PointerEvent } from "react";

/** Lo que se puede mover el puntero y seguir contando como un clic y no como un arrastre. */
const CLICK_SLOP = 4;

interface PlacementGripProps {
  label: string;
  onStart?: (e: PointerEvent<HTMLElement>) => void;
  /** Un clic (sin arrastrar) selecciona lo que se mueve. */
  onSelect?: () => void;
  disabled?: boolean;
  className?: string;
}

/** El asa para mover un elemento de la página a cualquier punto, o a otra página. */
export function PlacementGrip({ label, onStart, onSelect, disabled = false, className = "" }: PlacementGripProps) {
  const down = useRef<{ x: number; y: number } | null>(null);

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={disabled ? `${label} está bloqueada` : `Mover ${label}`}
      title={disabled ? `${label} está bloqueada · Desbloquea para mover` : `Arrastra para mover ${label} a cualquier punto o a otra página`}
      onPointerDown={
        disabled
          ? undefined
          : (e) => {
              down.current = { x: e.clientX, y: e.clientY };
              onStart?.(e);
            }
      }
      onClick={(e) => {
        e.stopPropagation();
        const start = down.current;
        down.current = null;
        // Un arrastre también termina en `click`: solo cuenta si el puntero casi no se movió.
        if (!disabled && onSelect && start && Math.hypot(e.clientX - start.x, e.clientY - start.y) <= CLICK_SLOP) onSelect();
      }}
      className={`z-30 flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-medium shadow transition-colors ${
        disabled
          ? "cursor-not-allowed bg-zinc-700/80 text-zinc-400 opacity-60 shadow-none"
          : "cursor-grab touch-none bg-sky-600 text-white active:cursor-grabbing hover:bg-sky-500"
      } ${className} cursor-pointer`}
    >
      <span aria-hidden>⠿</span> Mover
    </button>
  );
}
