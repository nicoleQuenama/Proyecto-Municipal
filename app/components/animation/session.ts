import type { RecordingBaseline } from "./animation-rules";
import type { ValueMap } from "./diff";
import type { AnimationStep } from "./types";

/** Lo que dura una grabación abierta: de dónde partió la página y lo que se lleva grabado. */
export interface Session {
  startedAt: number;
  pageId: string;
  baseline: RecordingBaseline;
  steps: AnimationStep[];
  last: ValueMap;
  /** Cuenta los gestos (cada vez que se pulsa el ratón o un dedo): lo que cambia dentro de uno es un solo paso. */
  gesture: number;
}

/** Los pasos grabados, listos para guardar: empiezan en el primero (el rato antes de hacer algo no cuenta) y sin marcas de gesto. */
export function sealSteps(steps: AnimationStep[]): AnimationStep[] {
  const first = Math.min(...steps.map((step) => step.at));
  return steps.map((step) => ({ ...step, gesture: undefined, at: Math.round(step.at - first) }));
}
