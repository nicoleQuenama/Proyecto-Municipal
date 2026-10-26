"use client";

import { AlphaColor } from "./alpha-color";
import type { Gradient, GradientStop } from "./gradient";

interface GradientStopsProps {
  gradient: Gradient;
  onChange: (next: Gradient) => void;
}

const MIN_STOPS = 2;

/** La lista de paradas de color: cada una con su color, su opacidad y su posición (0–100 %). */
export function GradientStops({ gradient, onChange }: GradientStopsProps) {
  const { stops } = gradient;
  const setStops = (next: GradientStop[]) => onChange({ ...gradient, stops: next });
  const patch = (index: number, change: Partial<GradientStop>) =>
    setStops(stops.map((stop, i) => (i === index ? { ...stop, ...change } : stop)));

  // Una parada nueva va en el hueco más ancho, con el color de su vecina.
  const add = () => {
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    const gaps = sorted.slice(1).map((s, i) => ({ from: sorted[i], size: s.position - sorted[i].position }));
    const widest = gaps.sort((a, b) => b.size - a.size)[0];
    setStops([...stops, { color: widest.from.color, position: Math.round(widest.from.position + widest.size / 2) }]);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] text-ink-dim">Colores del degradado</p>
      {stops.map((stop, index) => (
        <div key={index} className="flex flex-wrap items-center gap-1.5">
          <AlphaColor label={`Color ${index + 1}`} value={stop.color} onChange={(color) => patch(index, { color })} />
          <span className="text-[11px] text-ink-dim">en</span>
          <input
            type="number"
            min={0}
            max={100}
            aria-label={`Posición del color ${index + 1} (%)`}
            title="Dónde está este color, de 0 a 100 %"
            value={Math.round(stop.position)}
            onChange={(e) => {
              const next = e.target.valueAsNumber;
              if (!Number.isNaN(next)) patch(index, { position: Math.min(100, Math.max(0, next)) });
            }}
            className="h-8 w-12 rounded-md border border-line bg-canvas px-1 text-center text-xs text-ink outline-none focus:border-accent"
          />
          <span className="text-[11px] text-ink-dim">%</span>
          <button
            type="button"
            aria-label={`Quitar el color ${index + 1}`}
            disabled={stops.length <= MIN_STOPS}
            onClick={() => setStops(stops.filter((_, i) => i !== index))}
            className="flex h-7 w-7 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-red-400 disabled:opacity-30"
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className="h-8 self-start rounded-md px-2 text-xs text-accent hover:bg-hover">
        + Añadir color
      </button>
    </div>
  );
}
