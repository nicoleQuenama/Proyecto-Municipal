"use client";

import { composeColor, parseColor } from "./color-alpha";

interface AlphaColorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/** Un color con su selector y un campo de opacidad (0–100 %). */
export function AlphaColor({ label, value, onChange }: AlphaColorProps) {
  const parts = parseColor(value) ?? { hex: "#cccccc", alpha: 1 };

  return (
    <span className="flex shrink-0 items-center gap-1">
      <input
        type="color"
        aria-label={label}
        value={parts.hex}
        onChange={(e) => onChange(composeColor({ ...parts, hex: e.target.value }))}
        className="h-8 w-9 shrink-0 cursor-pointer rounded-md border border-line bg-canvas p-1"
      />
      <input
        type="number"
        min={0}
        max={100}
        aria-label={`Opacidad de ${label}`}
        title="Opacidad (0 = transparente, 100 = sólido)"
        value={Math.round(parts.alpha * 100)}
        onChange={(e) => {
          const next = e.target.valueAsNumber;
          if (!Number.isNaN(next)) onChange(composeColor({ ...parts, alpha: next / 100 }));
        }}
        className="h-8 w-12 rounded-md border border-line bg-canvas px-1 text-center text-xs text-ink outline-none focus:border-accent"
      />
      <span className="text-[11px] text-ink-dim">%</span>
    </span>
  );
}
