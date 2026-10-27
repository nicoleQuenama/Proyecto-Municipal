"use client";

import { useState } from "react";
import { normalizeHex } from "./hex-color";

/**
 * El color de un círculo, escrito como texto. Escribir un color y pulsar Enter (o salir del campo) lo aplica;
 * si no es un color válido, el campo vuelve al que tenía.
 */
export function HexField({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    const color = draft === null ? null : normalizeHex(draft);
    if (color && color !== value.toLowerCase()) onChange(color);
    setDraft(null);
  };

  return (
    <input
      type="text"
      aria-label={`Escribir el color ${value}`}
      title={value}
      value={draft ?? value}
      spellCheck={false}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={commit}
      onKeyDown={(e) => {
        e.stopPropagation(); // Supr o las flechas no deben tocar el elemento mientras se escribe
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setDraft(null);
          e.currentTarget.blur();
        }
      }}
      className="w-full rounded bg-canvas px-1 py-0.5 text-center font-mono text-[10px] text-ink-dim uppercase outline-none focus:text-ink focus:ring-1 focus:ring-accent"
    />
  );
}
