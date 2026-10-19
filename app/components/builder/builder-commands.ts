import type { Dispatch } from "react";
import type { CanvasCommands } from "../canvas-editing/use-canvas-gestures";
import type { BuilderAction } from "./builder-reducer";

/** Lo que un gesto en el lienzo del constructor cambia, como acciones del reductor. */
export const builderCommands = (dispatch: Dispatch<BuilderAction>): CanvasCommands => ({
  select: (id) => dispatch({ type: "select", id }),
  move: (id, x, y) => dispatch({ type: "move", id, x, y }),
  resize: (id, frame) => dispatch({ type: "resize", id, ...frame }),
  dock: (id, parentId, anchor) => dispatch({ type: "dock", id, parentId, anchor }),
});
