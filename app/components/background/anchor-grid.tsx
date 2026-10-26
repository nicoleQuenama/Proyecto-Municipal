"use client";

import { ANCHORS } from "./background-css";
import type { Anchor } from "./types";

const NAMES: Record<Anchor, string> = {
  tl: "arriba a la izquierda",
  tc: "arriba al centro",
  tr: "arriba a la derecha",
  ml: "a la izquierda",
  mc: "al centro",
  mr: "a la derecha",
  bl: "abajo a la izquierda",
  bc: "abajo al centro",
  br: "abajo a la derecha",
};

/** Los 9 puntos desde donde se ancla el fondo, como una cuadrícula de 3×3. */
export function AnchorGrid({ value, onChange }: { value: Anchor; onChange: (anchor: Anchor) => void }) {
  return (
    <div role="radiogroup" aria-label="Qué parte del fondo se ve" className="flex flex-col gap-1">
      <span className="text-[11px] text-ink-dim">Qué parte se ve</span>
      <div className="grid w-24 grid-cols-3 gap-1 rounded-md border border-line bg-canvas p-1.5">
        {ANCHORS.map((anchor) => (
          <button
            key={anchor}
            type="button"
            role="radio"
            aria-checked={anchor === value}
            aria-label={NAMES[anchor]}
            title={NAMES[anchor]}
            onClick={() => onChange(anchor)}
            className={`h-5 rounded-sm ${anchor === value ? "bg-accent" : "bg-hover hover:bg-ink-dim/40"}`}
          />
        ))}
      </div>
    </div>
  );
}
