"use client";

import { useState } from "react";
import { AlphaColor } from "./alpha-color";
import { buildGradient, DEFAULT_GRADIENT, isGradient, parseGradient } from "./gradient";
import { GradientEditor } from "./gradient-editor";

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Ofrece también degradados (para fondos y rellenos, no para el color del texto). */
  gradient?: boolean;
}

/** ¿Lo entiende el navegador? Con degradados se valida como fondo; si no, como color. */
const isValid = (value: string, gradient: boolean) =>
  typeof CSS !== "undefined" && CSS.supports(gradient ? "background" : "color", value);

/** Al pasar a degradado, el color actual es la primera parada. */
function gradientFrom(color: string): string {
  const [, end] = DEFAULT_GRADIENT.stops;
  return isGradient(color) ? color : buildGradient({ ...DEFAULT_GRADIENT, stops: [{ color, position: 0 }, end] });
}

const tab = (on: boolean) =>
  `h-7 flex-1 whitespace-nowrap rounded-md text-[11px] ${on ? "bg-accent text-white" : "text-ink-dim hover:bg-hover hover:text-ink"}`;

/**
 * Un color: el selector (con opacidad) y, al lado, un campo para escribirlo — admite `rgba(…)`, `var(--color-primario)`
 * o pegar uno de un diseño. Con `gradient`, una pestaña «Degradado» abre el editor visual.
 */
export function ColorInput({ label, value, onChange, gradient = false }: ColorInputProps) {
  // Mientras se escribe, el campo conserva lo tecleado aunque aún no sea un color válido. El borrador solo vale
  // mientras el color no cambie por otro lado (otro elemento elegido, el selector…): entonces manda el color.
  const [draft, setDraft] = useState<{ text: string; base: string } | null>(null);
  const shown = draft && draft.base === value ? draft.text : value;
  const isGradientMode = gradient && isGradient(value);

  return (
    <span className="flex flex-col gap-1.5">
      {gradient && (
        <span className="flex gap-1 rounded-lg bg-canvas p-0.5" role="tablist" aria-label={`Tipo de ${label}`}>
          <button type="button" role="tab" aria-selected={!isGradientMode} className={tab(!isGradientMode)}
            onClick={() => isGradientMode && onChange(parseGradient(value)?.stops[0].color ?? "#cccccc")}>
            Color sólido
          </button>
          <button type="button" role="tab" aria-selected={isGradientMode} className={tab(isGradientMode)}
            onClick={() => !isGradientMode && onChange(gradientFrom(value))}>
            Degradado
          </button>
        </span>
      )}

      {isGradientMode ? (
        <GradientEditor value={value} onChange={onChange} />
      ) : (
        <span className="flex gap-1.5">
          <AlphaColor label={label} value={value} onChange={onChange} />
          <input
            type="text"
            aria-label={`${label} (escribir)`}
            value={shown}
            spellCheck={false}
            onChange={(e) => {
              setDraft({ text: e.target.value, base: value });
              if (isValid(e.target.value.trim(), gradient)) onChange(e.target.value.trim());
            }}
            onBlur={() => setDraft(null)}
            className="h-8 min-w-0 flex-1 rounded-md border border-line bg-canvas px-2 font-mono text-xs text-ink outline-none focus:border-accent"
          />
        </span>
      )}
    </span>
  );
}
