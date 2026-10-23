"use client";

import type { PatchDevice } from "../types";

export const SCOPE_LABELS: Record<PatchDevice, string> = {
  all: "Todas las pantallas",
  tablet: "Tablet y móvil",
  mobile: "Solo móvil",
};

/** Dónde valen los cambios de estilo: así la persona define cómo se ve cada pantalla. */
export function ScopeSelect({ value, onChange }: { value: PatchDevice; onChange: (value: PatchDevice) => void }) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-ink-dim">Los estilos se aplican en</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as PatchDevice)}
        className="h-8 rounded-md border border-line bg-canvas px-2 text-[13px] outline-none focus:border-accent"
      >
        {(Object.keys(SCOPE_LABELS) as PatchDevice[]).map((value) => (
          <option key={value} value={value}>
            {SCOPE_LABELS[value]}
          </option>
        ))}
      </select>
    </label>
  );
}
