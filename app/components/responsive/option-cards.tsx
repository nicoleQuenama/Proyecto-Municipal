"use client";

import type { ReactNode } from "react";

export interface CardOption<T extends string> {
  value: T;
  label: string;
  help: string;
  art: ReactNode;
  disabled?: boolean;
}

interface OptionCardsProps<T extends string> {
  label: string;
  value: T;
  options: CardOption<T>[];
  onPick: (value: T) => void;
}

/** Tarjetas visuales para elegir una opción: un dibujo, su nombre y (al pasar el cursor) una frase de ayuda. */
export function OptionCards<T extends string>({ label, value, options, onPick }: OptionCardsProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-4 gap-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          title={option.help}
          disabled={option.disabled}
          onClick={() => onPick(option.value)}
          className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-1.5 text-[10px] leading-tight transition-colors ${
            option.value === value ? "border-accent bg-accent/15 text-ink" : "border-line text-ink-dim hover:bg-hover hover:text-ink disabled:opacity-35 disabled:hover:bg-transparent"
          }`}
        >
          {option.art}
          <span className="text-center">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

/** El marco de un teléfono con dibujos dentro, para las tarjetas. */
export function PhoneArt({ children }: { children: ReactNode }) {
  return (
    <svg width="34" height="46" viewBox="0 0 40 54" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="2" y="2" width="36" height="50" rx="5" />
      {children}
    </svg>
  );
}
