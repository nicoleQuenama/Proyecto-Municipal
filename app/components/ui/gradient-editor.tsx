"use client";

import { buildGradient, DEFAULT_GRADIENT, parseGradient, type Gradient } from "./gradient";
import { GRADIENT_PRESETS } from "./gradient-presets";
import { GradientStops } from "./gradient-stops";

const control = "h-8 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent";

interface GradientEditorProps {
  /** El degradado CSS actual. */
  value: string;
  onChange: (css: string) => void;
}

/** Editor visual de degradados: tipo, ángulo, colores, vista previa y prediseñados. */
export function GradientEditor({ value, onChange }: GradientEditorProps) {
  const gradient = parseGradient(value) ?? DEFAULT_GRADIENT;
  const set = (next: Gradient) => onChange(buildGradient(next));

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-line bg-panel p-2.5">
      <div
        aria-label="Vista previa del degradado"
        className="h-10 rounded-md border border-line"
        style={{ background: buildGradient(gradient) }}
      />

      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-[11px] text-ink-dim">
          Tipo
          <select
            aria-label="Tipo de degradado"
            value={gradient.type}
            onChange={(e) => set({ ...gradient, type: e.target.value as Gradient["type"] })}
            className={`${control} [&>option]:bg-panel`}
          >
            <option value="linear">Lineal (en línea recta)</option>
            <option value="radial">Radial (desde el centro)</option>
          </select>
        </label>
        {gradient.type === "linear" && (
          <label className="flex flex-col gap-1 text-[11px] text-ink-dim">
            Ángulo: {Math.round(gradient.angle)}°
            <input
              type="range"
              min={0}
              max={360}
              aria-label="Ángulo del degradado"
              value={gradient.angle}
              onChange={(e) => set({ ...gradient, angle: Number(e.target.value) })}
              className="h-8 accent-accent"
            />
          </label>
        )}
      </div>

      <GradientStops gradient={gradient} onChange={set} />

      <div className="flex flex-col gap-1">
        <p className="text-[11px] text-ink-dim">Prediseñados</p>
        <div className="grid grid-cols-6 gap-1.5">
          {GRADIENT_PRESETS.map(({ name, gradient: preset }) => (
            <button
              key={name}
              type="button"
              title={name}
              aria-label={`Degradado ${name}`}
              onClick={() => set(preset)}
              className="h-7 rounded-md border border-line hover:border-accent"
              style={{ background: buildGradient(preset) }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
