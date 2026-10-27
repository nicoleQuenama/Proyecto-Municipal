"use client";

import { useCanvasSettings, type EditScope } from "../canvas-editing/settings-context";
import { mineLabel, useSharedUsage } from "../site/use-shared-usage";

const OPTIONS: { value: EditScope; label: string; hint: string }[] = [
  { value: "block", label: "Este bloque", hint: "El formato solo cambia esta sección, en esta página." },
  { value: "component", label: "Todo el componente", hint: "El formato cambia todas las secciones que usan este componente." },
];

/** Para quien tiene acceso limitado, «todo el componente» es «todas mis secciones». */
function value_of(option: { value: EditScope; label: string; hint: string }, mine: { label: string; hint: string } | null) {
  return option.value === "component" && mine ? { ...option, ...mine } : option;
}

/** A dónde van los cambios de la barra: solo a este bloque o a todo el componente. */
export function ScopeSwitch() {
  const { settings, setSettings } = useCanvasSettings();
  const mine = mineLabel(useSharedUsage());

  return (
    <div role="group" aria-label="Dónde valen los cambios" className="flex shrink-0 gap-0.5 rounded-md bg-canvas p-0.5">
      {OPTIONS.map((option) => {
        const { value, label, hint } = value_of(option, mine);
        return (
        <button
          key={value}
          type="button"
          title={hint}
          aria-pressed={settings.scope === value}
          onClick={() => setSettings((current) => ({ ...current, scope: value }))}
          className={`h-6 rounded px-2 text-[11px] ${settings.scope === value ? "bg-accent/25 text-accent" : "text-ink-dim hover:text-ink"}`}
        >
          {label}
        </button>
        );
      })}
    </div>
  );
}
