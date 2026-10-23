"use client";

/** «Mostrar N más» al final de una lista por tramos; no se dibuja si no queda nada. */
export function ShowMore({ remaining, onClick }: { remaining: number; onClick: () => void }) {
  if (remaining <= 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="h-8 w-full rounded-md text-xs text-ink-dim hover:bg-hover hover:text-ink"
    >
      Mostrar {remaining} más
    </button>
  );
}
