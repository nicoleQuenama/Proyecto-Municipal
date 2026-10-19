"use client";

import type { Dispatch } from "react";
import type { BuilderAction, BuilderState } from "./builder-reducer";
import { CanvasProperties } from "./canvas-properties";
import { ElementProperties } from "./element-properties";

interface PropertiesPanelProps {
  state: BuilderState;
  dispatch: Dispatch<BuilderAction>;
  newId: () => string;
}

/** El panel de la derecha: las propiedades del elemento seleccionado o, sin selección, las del componente. */
export function PropertiesPanel({ state, dispatch, newId }: PropertiesPanelProps) {
  const element = state.elements.find((e) => e.id === state.selectedId);

  if (!element) return <CanvasProperties state={state} dispatch={dispatch} />;
  return <ElementProperties key={element.id} element={element} state={state} dispatch={dispatch} newId={newId} />;
}
