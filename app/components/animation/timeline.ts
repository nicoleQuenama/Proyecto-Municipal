import { durationOf } from "./play";
import type { AnimationStep } from "./types";

/** Los tiempos se ajustan a este paso (ms) para que los pasos se alineen con facilidad. */
export const SNAP_MS = 50;
/** Lo más corto que puede ser un paso (ms). */
export const MIN_DURATION = 50;
/** Lo que el eje de tiempo muestra de más después del último paso, y lo mínimo que muestra (ms). */
const PADDING_MS = 500;
const MIN_SPAN_MS = 2000;

export const snap = (ms: number) => Math.max(0, Math.round(ms / SNAP_MS) * SNAP_MS);

/** Una fila de la línea de tiempo: todos los pasos de una misma pieza (un elemento o una sección). */
export interface Track {
  id: string;
  blockId: string;
  key: string;
  steps: AnimationStep[];
}

export const trackId = (blockId: string, key: string) => `${blockId}:${key}`;

/** Agrupa los pasos por pieza, en el orden en que cada pieza empieza a moverse. */
export function groupTracks(steps: AnimationStep[]): Track[] {
  const tracks = new Map<string, Track>();
  for (const step of [...steps].sort((a, b) => a.at - b.at)) {
    const id = trackId(step.blockId, step.key);
    const track = tracks.get(id) ?? { id, blockId: step.blockId, key: step.key, steps: [] };
    track.steps.push(step);
    tracks.set(id, track);
  }
  return [...tracks.values()];
}

/** Cuánto tiempo (ms) abarca el eje: lo que dura la animación más un margen para estirar los pasos. */
export const spanOf = (steps: AnimationStep[]) => Math.max(MIN_SPAN_MS, Math.ceil((durationOf(steps) + PADDING_MS) / PADDING_MS) * PADDING_MS);

export const patchStep = (steps: AnimationStep[], id: string, patch: Partial<AnimationStep>) =>
  steps.map((step) => (step.id === id ? { ...step, ...patch } : step));

export const removeStep = (steps: AnimationStep[], id: string) => steps.filter((step) => step.id !== id);

export const removeTrack = (steps: AnimationStep[], track: Track) =>
  steps.filter((step) => trackId(step.blockId, step.key) !== track.id);

/** Copia un paso justo a continuación de sí mismo, para repetir un efecto. Devuelve la copia, o null si no existe. */
export function duplicateStep(steps: AnimationStep[], id: string, newId: string): AnimationStep[] {
  const original = steps.find((step) => step.id === id);
  if (!original) return steps;
  return [...steps, { ...original, id: newId, at: original.at + original.duration }];
}
