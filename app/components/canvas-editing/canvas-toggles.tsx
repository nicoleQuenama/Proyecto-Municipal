"use client";

import { CANVAS_TOGGLES } from "./canvas-options";
import { useCanvasSettings } from "./settings-context";

/** Los botones que activan la cuadrícula y las guías de alineación (en el constructor, donde hay sitio). */
export function CanvasToggles() {
  const { settings, setSettings } = useCanvasSettings();

  return (
    <>
      {CANVAS_TOGGLES.map(({ key, label, hint }) => (
        <button
          key={key}
          type="button"
          title={hint}
          aria-pressed={settings[key]}
          onClick={() => setSettings((current) => ({ ...current, [key]: !current[key] }))}
          className={`h-7 rounded-md border px-2 text-xs ${
            settings[key] ? "border-accent bg-accent/15 text-ink" : "border-line text-ink-dim hover:bg-hover"
          }`}
        >
          {label}
        </button>
      ))}
    </>
  );
}
