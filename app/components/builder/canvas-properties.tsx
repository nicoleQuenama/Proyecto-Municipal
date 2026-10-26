"use client";

import type { Dispatch } from "react";
import { MAX_CANVAS_HEIGHT, MAX_CANVAS_WIDTH, MIN_CANVAS_SIZE } from "../canvas-editing/limits";
import { NumberField } from "../ui/number-field";
import type { BuilderAction, BuilderState } from "./builder-reducer";
import { CategorySelect } from "./category-select";
import { Field, inputClass } from "./panel-fields";

/** Las propiedades del componente entero (cuando no hay ningún elemento seleccionado). */
export function CanvasProperties({ state, dispatch }: { state: BuilderState; dispatch: Dispatch<BuilderAction> }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[11px] font-semibold tracking-wider text-ink-dim uppercase">Componente</h3>

      <Field label="Categoría">
        <CategorySelect
          value={state.category}
          onChange={(category) => dispatch({ type: "meta", patch: { category } })}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="Ancho"
          value={state.width}
          min={MIN_CANVAS_SIZE}
          max={MAX_CANVAS_WIDTH}
          onChange={(width) => dispatch({ type: "meta", patch: { width } })}
        />
        <NumberField
          label="Alto"
          value={state.height}
          min={MIN_CANVAS_SIZE}
          max={MAX_CANVAS_HEIGHT}
          onChange={(height) => dispatch({ type: "meta", patch: { height } })}
        />
      </div>

      <p className="text-xs text-ink-dim">Selecciona un elemento del lienzo para editar sus propiedades.</p>
    </div>
  );
}
