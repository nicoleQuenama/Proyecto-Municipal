import type { PointerEvent } from "react";
import { MIN_DURATION, snap } from "./timeline";
import type { AnimationStep } from "./types";

/** Qué se hace al arrastrar una barra: moverla entera, o estirar su comienzo o su final. */
export type DragMode = "move" | "start" | "end";

type Timing = Pick<AnimationStep, "at" | "duration">;

/** Cómo cambia el tiempo de un paso según el modo y los ms que se arrastró. Un modo nuevo es una entrada nueva. */
const DRAGS: Record<DragMode, (base: Timing, delta: number) => Timing> = {
  move: (base, delta) => ({ at: snap(base.at + delta), duration: base.duration }),
  start: (base, delta) => {
    const end = base.at + base.duration;
    const at = Math.min(snap(base.at + delta), end - MIN_DURATION);
    return { at, duration: end - at };
  },
  end: (base, delta) => ({ at: base.at, duration: Math.max(MIN_DURATION, snap(base.duration + delta)) }),
};

/**
 * Arrastrar una barra de la línea de tiempo con el ratón. `msPerPixel` se lee al arrastrar
 * (el ancho del eje puede cambiar) y `onChange` recibe el tiempo nuevo del paso.
 */
export function startBarDrag(
  e: PointerEvent,
  mode: DragMode,
  step: AnimationStep,
  msPerPixel: () => number,
  onChange: (timing: Timing) => void,
) {
  e.preventDefault();
  e.stopPropagation();
  const startX = e.clientX;
  const base = { at: step.at, duration: step.duration };

  const move = (event: globalThis.PointerEvent) => onChange(DRAGS[mode](base, (event.clientX - startX) * msPerPixel()));
  const stop = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop);
}
