"use client";

import { HexField } from "../section-colors/hex-field";
import { MIN_STOPS, type Gradient } from "./gradient-model";

interface GradientPanelProps {
  gradient: Gradient;
  selected: number;
  /** Esquina inferior izquierda de lo que se pinta: el panel se pone debajo. */
  anchor: { left: number; top: number };
  onAngle: (angle: number) => void;
  onColor: (color: string) => void;
  onAdd: () => void;
  onRemove: () => void;
  onClose: () => void;
}

const WIDTH = 288;
const HEIGHT = 130;
const MARGIN = 8;
const button = "h-7 rounded-md px-2 text-xs hover:bg-hover";

/** Los datos del degradado: el ángulo, el color del punto elegido y los botones para añadir, quitar y terminar. */
export function GradientPanel({ gradient, selected, anchor, onAngle, onColor, onAdd, onRemove, onClose }: GradientPanelProps) {
  const stop = gradient.stops[selected];
  const left = Math.max(MARGIN, Math.min(anchor.left, window.innerWidth - WIDTH - MARGIN));
  const top = Math.max(MARGIN, Math.min(anchor.top + MARGIN, window.innerHeight - HEIGHT - MARGIN));

  return (
    <div
      role="group"
      aria-label="Degradado"
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto absolute flex flex-col gap-2 rounded-xl border border-line bg-panel p-3 text-xs text-ink shadow-2xl"
      style={{ left, top, width: WIDTH }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">Degradado</span>
        <button type="button" onClick={onClose} className={`${button} bg-accent text-white hover:bg-accent/90`}>
          Listo
        </button>
      </div>

      <label className="flex items-center justify-between gap-2 text-[11px] text-ink-dim">
        Ángulo
        <input
          type="number"
          aria-label="Ángulo del degradado"
          min={0}
          max={359}
          value={gradient.angle}
          onChange={(e) => onAngle(Number(e.target.value) || 0)}
          className="h-7 w-20 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent"
        />
      </label>

      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`Color del punto ${selected + 1}`}
          value={stop.color.length === 7 ? stop.color : "#000000"}
          onChange={(e) => onColor(e.target.value)}
          className="size-7 shrink-0 cursor-pointer rounded-full border border-line bg-transparent p-0"
        />
        <div className="w-24">
          <HexField value={stop.color} onChange={onColor} />
        </div>
        <button type="button" onClick={onAdd} className={`${button} border border-line`}>
          + Punto
        </button>
        <button type="button" disabled={gradient.stops.length <= MIN_STOPS} onClick={onRemove} className={`${button} text-red-400 disabled:opacity-40`}>
          Quitar
        </button>
      </div>
    </div>
  );
}
