"use client";

import type { Dispatch } from "react";
import type { BuilderAction, BuilderState } from "./builder-reducer";
import { fitToContent, SIZE_PRESETS } from "./size-presets";

const chip = "h-7 rounded-md border border-line px-2 text-[11px] text-ink hover:bg-hover";

/** Tamaños de uso común y «Ajustar al contenido»: nadie tiene que saber de memoria cuánto mide una tarjeta. */
export function SizeSuggestions({ state, dispatch }: { state: BuilderState; dispatch: Dispatch<BuilderAction> }) {
  const fit = fitToContent(state.elements);
  const set = (width: number, height: number) => dispatch({ type: "meta", patch: { width, height } });

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] text-ink-dim">Tamaños sugeridos</span>
      <div className="flex flex-wrap gap-1">
        {SIZE_PRESETS.map((preset) => (
          <button key={preset.label} type="button" title={`${preset.width} × ${preset.height}`} onClick={() => set(preset.width, preset.height)} className={chip}>
            {preset.label}
          </button>
        ))}
        {fit && (
          <button type="button" onClick={() => set(fit.width, fit.height)} className={`${chip} border-accent text-accent`}>
            Ajustar al contenido
          </button>
        )}
      </div>
    </div>
  );
}
