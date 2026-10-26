"use client";

import type { ReactNode } from "react";
import { DEVICE_NAME, type AdaptiveDevice } from "./devices";
import { STRATEGY_OPTIONS } from "./strategy-options";
import type { AdaptMode } from "./types";

interface ResponsiveChipProps {
  device: AdaptiveDevice;
  /** Cómo se está adaptando ahora la sección en este dispositivo. */
  mode: AdaptMode;
  onPick: (mode: AdaptMode) => void;
  /** Los ajustes del modo elegido y de la presentación de secciones largas. */
  children?: ReactNode;
}

/** Elige cómo se adapta la sección seleccionada en este dispositivo: escalar, apilar o definirla a mano. */
export function ResponsiveChip({ device, mode, onPick, children }: ResponsiveChipProps) {
  const current = STRATEGY_OPTIONS.find((option) => option.mode === mode);

  return (
    <div
      role="group"
      aria-label={`Adaptación a ${DEVICE_NAME[device].plain}`}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-full left-1/2 z-40 mt-3 flex w-max max-h-[50vh] max-w-[min(24rem,90vw)] -translate-x-1/2 flex-col overflow-y-auto items-center gap-1 rounded-2xl border border-line bg-panel p-1 text-[11px] text-ink shadow-xl"
    >
      <div className="flex flex-wrap items-center justify-center gap-0.5">
        <span className="px-2 text-ink-dim">En {DEVICE_NAME[device].plain}:</span>
        {STRATEGY_OPTIONS.map((option) => (
          <button
            key={option.mode}
            type="button"
            title={option.help}
            aria-pressed={option.mode === mode}
            onClick={option.mode === mode ? undefined : () => onPick(option.mode)}
            className={`flex h-6 items-center gap-1 rounded-full px-2 whitespace-nowrap transition-colors ${
              option.mode === mode ? "bg-accent text-white" : "text-ink-dim hover:bg-hover hover:text-ink"
            }`}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>
      {current && <p className="px-2 pb-1 text-center text-ink-dim">{current.help}</p>}
      {children}
    </div>
  );
}
