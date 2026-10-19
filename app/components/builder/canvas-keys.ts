import type { Dispatch, KeyboardEvent } from "react";
import type { BuilderAction } from "./builder-reducer";

/** Cuánto mueve cada flecha, en la dirección (dx, dy) y por el paso elegido. */
const NUDGES: Record<string, (step: number) => [number, number]> = {
  ArrowLeft: (step) => [-step, 0],
  ArrowRight: (step) => [step, 0],
  ArrowUp: (step) => [0, -step],
  ArrowDown: (step) => [0, step],
};

const REMOVE_KEYS = ["Delete", "Backspace"];

/** Flechas ajustan 1 px (Shift: 10); Supr elimina el elemento seleccionado. */
export function handleCanvasKey(e: KeyboardEvent, selectedId: string | null, dispatch: Dispatch<BuilderAction>) {
  if (!selectedId) return;

  const nudge = NUDGES[e.key];
  if (nudge) {
    const [dx, dy] = nudge(e.shiftKey ? 10 : 1);
    dispatch({ type: "nudge", id: selectedId, dx, dy });
  } else if (REMOVE_KEYS.includes(e.key)) {
    dispatch({ type: "remove", id: selectedId });
  } else {
    return;
  }
  e.preventDefault();
}
