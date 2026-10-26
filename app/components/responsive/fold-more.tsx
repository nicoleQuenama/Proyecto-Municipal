"use client";

import { useState, type ReactNode } from "react";
import { isTrimmed } from "./fold-model";
import type { MoreFold } from "./types";

interface FoldMoreProps {
  fold: MoreFold;
  height: number;
  /** El fondo de la sección: el degradado se funde con él. */
  background?: string;
  /** Al editar se ve la sección entera, con una línea donde se cortará. */
  active: boolean;
  children: ReactNode;
}

const FADE = 80;

/** Un fondo liso para el degradado; con un degradado de fondo (o sin fondo) se usa blanco. */
const solid = (background?: string) =>
  !background || background === "transparent" || background.includes("gradient") ? "#ffffff" : background;

/** «Ver más»: la sección se recorta a una altura con un degradado y un botón para verla entera. */
export function FoldMore({ fold, height, background, active, children }: FoldMoreProps) {
  const [expanded, setExpanded] = useState(false);
  const trimmed = isTrimmed(height, fold.maxHeight);
  const clipped = active && trimmed && !expanded;

  return (
    <div className="relative">
      <div style={clipped ? { maxHeight: fold.maxHeight, overflow: "hidden" } : undefined}>{children}</div>
      {clipped && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0"
          style={{ top: fold.maxHeight - FADE, height: FADE, background: `linear-gradient(to bottom, transparent, ${solid(background)})` }}
        />
      )}
      {!active && trimmed && (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-sky-500" style={{ top: fold.maxHeight }}>
          <span className="rounded-b bg-sky-500 px-1.5 text-[10px] text-white">Aquí se corta («Ver más»)</span>
        </div>
      )}
      {active && trimmed && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          className="relative z-10 mx-auto mt-1 block cursor-pointer rounded-full border border-current/30 px-4 py-1.5 text-sm font-medium hover:bg-black/5"
        >
          {expanded ? fold.lessLabel : fold.moreLabel}
        </button>
      )}
    </div>
  );
}
