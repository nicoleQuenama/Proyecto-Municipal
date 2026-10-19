import { layoutDocked } from "../canvas-editing/dock-layout";
import type { BuilderAction, BuilderState, Handlers } from "./builder-types";
import { CANVAS_HANDLERS } from "./canvas-handlers";
import { ELEMENT_HANDLERS } from "./element-handlers";
import { PLACEMENT_HANDLERS } from "./placement-handlers";

export { initialBuilderState } from "./builder-types";
export type { BuilderAction, BuilderState } from "./builder-types";

const HANDLERS: Handlers<BuilderAction["type"]> = { ...CANVAS_HANDLERS, ...ELEMENT_HANDLERS, ...PLACEMENT_HANDLERS };

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  // TypeScript no puede relacionar el tipo de la acción con su manejador, pero `Handlers` lo garantiza.
  const handle = HANDLERS[action.type] as (state: BuilderState, action: BuilderAction) => BuilderState;
  const next = handle(state, action);
  // Lo acoplado se recoloca tras cualquier cambio: así sigue a su contenedor.
  return { ...next, elements: layoutDocked(next.elements) };
}
