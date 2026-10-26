"use client";

import type { CSSProperties, ReactNode } from "react";

export interface CardOption<T extends string> {
  value: T;
  label: string;
  /** Dibujo pequeño de lo que significa la opción. */
  preview?: ReactNode;
}

interface OptionCardsProps<T extends string> {
  label: string;
  value: T;
  options: CardOption<T>[];
  onChange: (value: T) => void;
}

/** Una pregunta con tarjetas visuales para elegir (en vez de una lista desplegable). */
export function OptionCards<T extends string>({ label, value, options, onChange }: OptionCardsProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-1">
      <span className="text-[11px] text-ink-dim">{label}</span>
      <div className="grid grid-cols-4 gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            onClick={() => onChange(option.value)}
            className={`flex flex-col items-center gap-1 rounded-md border px-1 py-1.5 text-[10px] leading-tight ${
              option.value === value ? "border-accent bg-accent/15 text-ink" : "border-line text-ink-dim hover:bg-hover"
            }`}
          >
            {option.preview}
            <span className="text-center">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Un marco de pantalla en miniatura con una pieza dibujada dentro. */
export function MiniScreen({ piece }: { piece: CSSProperties }) {
  return (
    <span aria-hidden className="relative block h-5 w-8 rounded-[3px] border border-ink-dim/60 bg-canvas">
      <span className="absolute rounded-[2px] bg-accent" style={piece} />
    </span>
  );
}
