/**
 * Limpieza de lo que queda colgando cuando se elimina algo: animaciones, funciones, selección…
 * Son reglas puras; las usan `removal-rules.ts` y el reducer.
 */

import type { AnimationStep, RecordedAnimation } from "../animation/types";
import { TITLE_SELECTION, type BlockInstance, type Page, type SiteState } from "./types";

/** Quita de las animaciones los pasos que cumplen `drop`; una animación que se queda sin pasos desaparece. */
function pruneAnimations(
  animations: RecordedAnimation[] | undefined,
  drop: (step: AnimationStep) => boolean,
): RecordedAnimation[] | undefined {
  if (!animations) return animations;
  const kept = animations
    .map((animation) => ({ animation, steps: animation.steps.filter((step) => !drop(step)) }))
    .filter(({ animation, steps }) => steps.length > 0 || animation.steps.length === 0)
    .map(({ animation, steps }) => ({ ...animation, steps }));
  return kept.length > 0 ? kept : undefined;
}

/** Quita las claves indicadas de un mapa; si no queda nada, `undefined`. */
export function omitKeys<T>(map: Record<string, T> | undefined, keys: Set<string>): Record<string, T> | undefined {
  if (!map) return map;
  const rest = Object.fromEntries(Object.entries(map).filter(([key]) => !keys.has(key)));
  return Object.keys(rest).length > 0 ? rest : undefined;
}

/** Lo que un bloque guarda de unos elementos suyos (datos, código, interacciones, diseño móvil), fuera. */
export function dropElementRefs(block: BlockInstance, ids: Set<string>): BlockInstance {
  const behaviors = block.behaviors?.filter((b) => !ids.has(b.scope));
  const responsive = block.responsive
    ? Object.fromEntries(
        Object.entries(block.responsive).map(([device, layout]) => [
          device,
          layout && { ...layout, frames: omitKeys(layout.frames, ids) ?? {} },
        ]),
      )
    : undefined;
  return {
    ...block,
    bindings: omitKeys(block.bindings, ids),
    custom: omitKeys(block.custom, ids),
    behaviors: behaviors && behaviors.length > 0 ? behaviors : undefined,
    responsive,
  };
}

/** Animaciones y funciones que apuntaban a elementos eliminados de unos bloques. */
export function dropElementTargets(state: SiteState, blockIds: Set<string>, ids: Set<string>): SiteState {
  const hit = (step: AnimationStep) => blockIds.has(step.blockId) && ids.has(step.key);
  return {
    ...state,
    pages: state.pages.map((page): Page => ({ ...page, animations: pruneAnimations(page.animations, hit) })),
    functions: state.functions.filter(
      (f) => f.scope.kind !== "element" || !(blockIds.has(f.scope.blockId) && ids.has(f.scope.elementId)),
    ),
  };
}

/** Animaciones y funciones que apuntaban a bloques que ya no existen. */
export function dropBlockTargets(state: SiteState, blockIds: Set<string>): SiteState {
  return {
    ...state,
    pages: state.pages.map((page): Page => ({
      ...page,
      animations: pruneAnimations(page.animations, (step) => blockIds.has(step.blockId)),
    })),
    functions: state.functions.filter((f) => f.scope.kind === "global" || !blockIds.has(f.scope.blockId)),
  };
}

/** Si lo seleccionado era uno de los bloques eliminados, la selección vuelve al titular. */
export function clearSelection(state: SiteState, blockIds: Set<string>): SiteState {
  if (!blockIds.has(state.selectedId)) return state;
  return { ...state, selectedId: TITLE_SELECTION, selectedElementId: null, alsoSelectedIds: undefined };
}
