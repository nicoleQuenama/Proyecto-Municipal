import type { Dispatch, KeyboardEvent } from "react";
import type { BuilderAction, BuilderState } from "./builder-reducer";
import { copyElements, readElementClip } from "./element-clipboard";
import { selectedIdsOf, withoutNested } from "./selection";

/** Cuánto mueve cada flecha, en la dirección (dx, dy) y por el paso elegido. */
const NUDGES: Record<string, (step: number) => [number, number]> = {
  ArrowLeft: (step) => [-step, 0],
  ArrowRight: (step) => [step, 0],
  ArrowUp: (step) => [0, -step],
  ArrowDown: (step) => [0, step],
};

const REMOVE_KEYS = ["Delete", "Backspace"];

/** Dónde las teclas de copiar no actúan: ahí valen las del navegador. */
const TYPING = "input, textarea, select, [contenteditable]";

const pasteClip = (clip: ReturnType<typeof readElementClip>, dispatch: Dispatch<BuilderAction>) =>
  dispatch({ type: "paste", clip, ids: clip.map(() => crypto.randomUUID()) });

/** Ctrl/⌘ + C copia, V pega y D duplica lo seleccionado (con lo que lleva dentro). */
function handleClipboardKey(e: KeyboardEvent, state: BuilderState, dispatch: Dispatch<BuilderAction>): boolean {
  if (!(e.ctrlKey || e.metaKey) || e.altKey || (e.target as Element).closest?.(TYPING)) return false;

  const key = e.key.toLowerCase();
  if (key === "v") {
    const clip = readElementClip();
    if (clip.length === 0) return false;
    pasteClip(clip, dispatch);
    return true;
  }
  const selected = selectedIdsOf(state);
  if ((key === "c" || key === "d") && selected.length > 0) {
    const clip = copyElements(state.elements, selected);
    if (clip.length === 0) return false;
    if (key === "d") pasteClip(clip, dispatch);
    return true;
  }
  if (key === "a") {
    state.elements.forEach((element, index) => dispatch({ type: "select", id: element.id, additive: index > 0 }));
    return state.elements.length > 0;
  }
  return false;
}

/** Flechas ajustan 1 px (Shift: 10); Supr elimina; Ctrl+C/V/D copian, pegan y duplican; todo sobre la selección. */
export function handleCanvasKey(e: KeyboardEvent, state: BuilderState, dispatch: Dispatch<BuilderAction>) {
  if (handleClipboardKey(e, state, dispatch)) {
    e.preventDefault();
    return;
  }

  const selected = selectedIdsOf(state);
  if (selected.length === 0) return;

  const nudge = NUDGES[e.key];
  if (nudge) {
    const [dx, dy] = nudge(e.shiftKey ? 10 : 1);
    // Lo que va dentro de un contenedor seleccionado ya se mueve con él.
    withoutNested(state.elements, selected).forEach((id) => dispatch({ type: "nudge", id, dx, dy }));
  } else if (REMOVE_KEYS.includes(e.key)) {
    selected.forEach((id) => dispatch({ type: "remove", id }));
  } else {
    return;
  }
  e.preventDefault();
}
