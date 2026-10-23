"use client";

import type { AdaptiveDevice } from "./devices";
import type { DeviceLayout } from "./types";

const DEVICE_NAME: Record<AdaptiveDevice, string> = { tablet: "tablet", mobile: "móvil" };

interface ResponsiveChipProps {
  device: AdaptiveDevice;
  manual: boolean;
  /** Pasa a un diseño propio (con este punto de partida) o, con `null`, vuelve al automático. */
  onChange: (layout: DeviceLayout | null) => void;
  seed: () => DeviceLayout;
}

/** Elige cómo se adapta la sección seleccionada en este dispositivo: sola, o como la defina la persona. */
export function ResponsiveChip({ device, manual, onChange, seed }: ResponsiveChipProps) {
  const options = [
    { label: "Automático", active: !manual, pick: () => onChange(null), hint: "El CMS adapta la sección al ancho" },
    { label: "Lo defino yo", active: manual, pick: () => onChange(seed()), hint: "Mueve y ajusta cada elemento" },
  ];

  return (
    <div
      role="group"
      aria-label={`Adaptación a ${DEVICE_NAME[device]}`}
      onClick={(e) => e.stopPropagation()}
      className="absolute -bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-line bg-panel p-0.5 text-[11px] whitespace-nowrap shadow-xl"
    >
      <span className="px-2 text-ink-dim">Adaptación a {DEVICE_NAME[device]}:</span>
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          title={option.hint}
          aria-pressed={option.active}
          onClick={option.active ? undefined : option.pick}
          className={`h-6 rounded-full px-2.5 transition-colors ${
            option.active ? "bg-accent text-white" : "text-ink-dim hover:bg-hover hover:text-ink"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
