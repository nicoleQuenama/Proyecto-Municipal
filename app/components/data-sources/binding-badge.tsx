import type { DataRef } from "./types";

interface BindingBadgeProps {
  label: string;
  reference: DataRef;
  onClear: () => void;
  className?: string;
}

/** Marca de que algo viene de una API, con su clave y un botón para soltarla. */
export function BindingBadge({ label, reference, onClear, className = "" }: BindingBadgeProps) {
  return (
    <span
      className={`flex max-w-48 items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] text-white ${className}`}
      title={`${label}: ${reference.path || "toda la respuesta"}`}
    >
      <span className="truncate">{reference.path || "respuesta"}</span>
      <button type="button" aria-label="Quitar el dato de la API" onClick={onClear} className="hover:opacity-70">
        ×
      </button>
    </span>
  );
}
