import type { TrackedProp } from "./step-props";
import type { AnimationStep } from "./types";

/** Los valores de las propiedades grabables de un destino (un elemento o una sección). */
export interface TargetValues {
  blockId: string;
  key: string;
  values: Partial<Record<TrackedProp, string | number>>;
}

/** Los destinos de una página, por su clave en el DOM (`bloque:elemento`). */
export type ValueMap = Record<string, TargetValues>;

/** Los cambios de un mismo gesto (un arrastre, el selector de color…) en la misma propiedad son un solo paso, si no pasa tanto entre uno y otro. */
export const COALESCE_MS = 1500;
/** Lo que dura como mínimo un paso (un cambio de color es instantáneo al grabar). */
export const MIN_STEP_MS = 400;

/**
 * Añade a los pasos lo que cambió entre dos lecturas de la página. Un gesto largo da un solo paso
 * con la duración real; lo que no existía antes (otro bloque, otra página) no cuenta como cambio.
 */
export function recordChanges(
  steps: AnimationStep[],
  before: ValueMap,
  after: ValueMap,
  now: number,
  gesture: number,
): AnimationStep[] {
  const next = [...steps];

  for (const [target, current] of Object.entries(after)) {
    const previous = before[target];
    if (!previous) continue;

    for (const prop of Object.keys(current.values) as TrackedProp[]) {
      const from = previous.values[prop];
      const to = current.values[prop];
      if (from === undefined || to === undefined || from === to) continue;

      const index = next.findLastIndex(
        (step) => step.blockId === current.blockId && step.key === current.key && step.prop === prop,
      );
      const last = next[index];

      if (last && last.gesture === gesture && now - (last.at + last.duration) <= COALESCE_MS) {
        next[index] = { ...last, to, duration: Math.max(MIN_STEP_MS, now - last.at) };
      } else {
        next.push({ id: crypto.randomUUID(), blockId: current.blockId, key: current.key, prop, from, to, at: now, duration: MIN_STEP_MS, gesture });
      }
    }
  }
  return next;
}
