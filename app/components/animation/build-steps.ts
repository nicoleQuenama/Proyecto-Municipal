import { PRESETS, type PresetId, type PresetParams, type Preset } from "./presets";
import type { AnimationStep } from "./types";

/** Una pieza de la página que se anima: un elemento, o la sección entera con `SECTION_KEY`. */
export interface StepTarget {
  blockId: string;
  key: string;
}

/** Lo que dura un efecto instantáneo. */
const INSTANT_MS = 1;

/**
 * Convierte un efecto en los pasos de una animación. Cada destino empieza un poco después del anterior
 * (la cascada), y `startAt` desplaza todo (para añadir un efecto a una grabación en marcha).
 */
export function buildSteps(
  presetId: PresetId,
  params: PresetParams,
  targets: StepTarget[],
  easing: string,
  startAt = 0,
): AnimationStep[] {
  const preset: Preset = PRESETS[presetId];
  const duration = preset.instant ? INSTANT_MS : params.duration;

  return targets.flatMap((target, index) =>
    preset.parts(params).map((part) => ({
      id: crypto.randomUUID(),
      blockId: target.blockId,
      key: target.key,
      prop: part.prop,
      from: part.from,
      to: part.to,
      at: Math.round(startAt + params.delay + index * params.stagger + (part.start ?? 0) * duration),
      duration: Math.max(INSTANT_MS, Math.round((part.span ?? 1) * duration)),
      easing,
    })),
  );
}
