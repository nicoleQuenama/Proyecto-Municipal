import { STEP_META } from "./step-meta";
import type { AnimationStep, StepProp } from "./types";

/** Un efecto es lo que le pasa a una pieza de una sola vez (p. ej. aparecer: se ve y sube a la vez). */
export interface Effect {
  id: string;
  blockId: string;
  key: string;
  stepIds: string[];
  /** Cuándo empieza y cuánto dura, en milisegundos. */
  at: number;
  duration: number;
  props: StepProp[];
}

const end = (step: AnimationStep) => step.at + step.duration;

/** Junta los pasos de una misma pieza que se pisan en el tiempo: para quien edita, son un solo efecto. */
export function groupEffects(steps: AnimationStep[]): Effect[] {
  const byTarget = new Map<string, AnimationStep[]>();
  for (const step of steps) byTarget.set(`${step.blockId}:${step.key}`, [...(byTarget.get(`${step.blockId}:${step.key}`) ?? []), step]);

  const effects: Effect[] = [];
  for (const group of byTarget.values()) {
    let current: AnimationStep[] = [];
    let currentEnd = 0;
    const close = () => {
      if (current.length === 0) return;
      const at = Math.min(...current.map((s) => s.at));
      effects.push({
        id: current[0].id,
        blockId: current[0].blockId,
        key: current[0].key,
        stepIds: current.map((s) => s.id),
        at,
        duration: Math.max(...current.map(end)) - at,
        props: [...new Set(current.map((s) => s.prop))],
      });
    };

    for (const step of [...group].sort((a, b) => a.at - b.at)) {
      if (current.length > 0 && step.at >= currentEnd) {
        close();
        current = [];
      }
      current.push(step);
      currentEnd = Math.max(currentEnd, end(step));
    }
    close();
  }
  return effects.sort((a, b) => a.at - b.at);
}

/** Lo que el efecto cambia, dicho en palabras: «Visibilidad, Desplazamiento». */
export const describeProps = (props: StepProp[]): string => props.map((prop) => STEP_META[prop].label).join(", ");

/** Cambia cuándo empieza (mueve todos sus pasos) o cuánto dura (los estira o encoge juntos, sin deshacer su ritmo). */
export function retimeEffect(steps: AnimationStep[], effect: Effect, change: { at?: number; duration?: number }): AnimationStep[] {
  const at = change.at ?? effect.at;
  const factor = change.duration === undefined ? 1 : change.duration / effect.duration;

  return steps.map((step) =>
    effect.stepIds.includes(step.id)
      ? { ...step, at: Math.round(at + (step.at - effect.at) * factor), duration: Math.max(1, Math.round(step.duration * factor)) }
      : step,
  );
}

export const removeEffect = (steps: AnimationStep[], effect: Effect): AnimationStep[] =>
  steps.filter((step) => !effect.stepIds.includes(step.id));
