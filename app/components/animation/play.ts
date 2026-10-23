import { targetKey } from "../site/custom-code";
import { STEP_PROPS } from "./step-props";
import type { AnimationStep } from "./types";

const TAG = "recorded-animation";
const DEFAULT_EASING = "ease-in-out";

interface PlayOptions {
  /** Sin movimiento si la persona lo pidió así en su sistema (en la vista previa del editor no se respeta). */
  respectReducedMotion?: boolean;
  /** Con false, la animación queda lista y en pausa en su primer fotograma, esperando `play()`. */
  autoplay?: boolean;
}

export interface Playback {
  finished: Promise<void>;
  play: () => void;
  pause: () => void;
  /** Salta a un instante de la animación (ms desde su inicio). */
  seek: (ms: number) => void;
  /** En qué instante va (ms desde su inicio). */
  time: () => number;
  cancel: () => void;
}

const NOTHING: Playback = {
  finished: Promise.resolve(),
  play: () => {},
  pause: () => {},
  seek: () => {},
  time: () => 0,
  cancel: () => {},
};

/** Los pasos de una misma propiedad de un mismo destino, en orden: solo el primero muestra su valor inicial al esperar. */
function firstOfEachChain(steps: AnimationStep[]): Set<string> {
  const first = new Map<string, AnimationStep>();
  for (const step of steps) {
    const chain = `${step.blockId}:${step.key}:${step.prop}`;
    const current = first.get(chain);
    if (!current || step.at < current.at) first.set(chain, step);
  }
  return new Set([...first.values()].map((step) => step.id));
}

/**
 * Reproduce los pasos de una animación sobre el DOM de `root`. Cada paso espera su momento (`delay`) y se queda
 * en su valor final. Reproducir de nuevo reinicia lo anterior.
 */
export function playAnimation(root: ParentNode, steps: AnimationStep[], options: PlayOptions = {}): Playback {
  if (options.respectReducedMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return NOTHING;

  const animations: Animation[] = [];
  const cleared = new Set<Element>();
  const firsts = firstOfEachChain(steps);

  for (const step of steps) {
    const target = root.querySelector(`[data-target="${CSS.escape(targetKey(step.blockId, step.key))}"]`);
    if (!target) continue;

    if (!cleared.has(target)) {
      target.getAnimations().filter((a) => a.id === TAG).forEach((a) => a.cancel());
      cleared.add(target);
    }
    const animation = target.animate([STEP_PROPS[step.prop](step.from), STEP_PROPS[step.prop](step.to)], {
      id: TAG,
      delay: step.at,
      duration: step.duration,
      easing: step.easing ?? DEFAULT_EASING,
      // Antes de empezar, solo el primer paso de cada cadena fija el valor inicial: los siguientes no lo pisan.
      fill: firsts.has(step.id) ? "both" : "forwards",
    });
    if (options.autoplay === false) animation.pause();
    animations.push(animation);
  }

  return {
    finished: Promise.all(animations.map((a) => a.finished.catch(() => undefined))).then(() => undefined),
    play: () => animations.forEach((a) => a.play()),
    pause: () => animations.forEach((a) => a.pause()),
    seek: (ms) => animations.forEach((a) => (a.currentTime = ms)),
    time: () => Number(animations[0]?.currentTime ?? 0),
    cancel: () => animations.forEach((a) => a.cancel()),
  };
}

/** Cuánto dura una animación entera, en ms. */
export const durationOf = (steps: AnimationStep[]) => steps.reduce((end, step) => Math.max(end, step.at + step.duration), 0);
