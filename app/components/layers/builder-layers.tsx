"use client";

import type { Dispatch } from "react";
import type { BuilderAction, BuilderState } from "../builder/builder-reducer";
import { LayersPanel } from "./layers-panel";

interface BuilderLayersProps {
  state: BuilderState;
  dispatch: Dispatch<BuilderAction>;
}

/** Las capas del componente que se está construyendo (arriba, lo que está delante). */
export function BuilderLayers({ state, dispatch }: BuilderLayersProps) {
  return (
    <section aria-label="Capas" className="mb-3 flex max-h-60 flex-col gap-2 overflow-y-auto border-b border-line pb-3">
      <h3 className="text-[11px] font-semibold tracking-wider text-ink-dim uppercase">Capas</h3>
      <LayersPanel
        elements={state.elements}
        selectedId={state.selectedId}
        onSelect={(id) => dispatch({ type: "select", id })}
        onPatch={(id, patch) => dispatch({ type: "update", id, patch })}
        onReorder={(ids) => dispatch({ type: "order", ids })}
      />
    </section>
  );
}
