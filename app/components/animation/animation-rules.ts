/** Reglas puras de las animaciones grabadas de una página. */

import type { Behavior } from "../behaviors/types";
import type { BlockInstance, ComponentDef, Page, SiteState } from "../site/types";
import type { AnimationStep, RecordedAnimation } from "./types";

/** El estado de la página al empezar a grabar: lo que se restaura al terminar. */
export interface RecordingBaseline {
  blocks: BlockInstance[];
  components: ComponentDef[];
}

const updatePage = (state: SiteState, pageId: string, update: (page: Page) => Page): SiteState => ({
  ...state,
  pages: state.pages.map((page) => (page.id === pageId ? update(page) : page)),
});

/**
 * Termina una grabación. Lo que se hizo mientras tanto era para grabarlo, no para quedarse: los bloques que ya
 * existían y los componentes vuelven a como estaban, y la animación se guarda en la página (si hay una).
 */
export function finishRecording(
  state: SiteState,
  pageId: string,
  baseline: RecordingBaseline,
  animation: RecordedAnimation | undefined,
): SiteState {
  const original = new Map(baseline.blocks.map((block) => [block.id, block]));
  const restored = updatePage(state, pageId, (page) => ({
    ...page,
    blocks: page.blocks.map((block) => original.get(block.id) ?? block),
    animations: animation ? [...(page.animations ?? []), animation] : page.animations,
  }));
  return { ...restored, components: baseline.components };
}

/** Guarda una animación nueva en una página y, si hay una interacción que la dispare, la deja puesta en la sección. */
export function addAnimation(
  state: SiteState,
  pageId: string,
  animation: RecordedAnimation,
  trigger?: { blockId: string; behavior: Behavior },
): SiteState {
  return updatePage(state, pageId, (page) => ({
    ...page,
    animations: [...(page.animations ?? []), animation],
    blocks: page.blocks.map((block) =>
      block.id === trigger?.blockId ? { ...block, behaviors: [...(block.behaviors ?? []), trigger.behavior] } : block,
    ),
  }));
}

export function renameAnimation(state: SiteState, pageId: string, id: string, name: string): SiteState {
  return updatePage(state, pageId, (page) => ({
    ...page,
    animations: page.animations?.map((animation) => (animation.id === id ? { ...animation, name } : animation)),
  }));
}

/** Cambia los pasos de una animación (lo que se edita en su línea de tiempo). */
export function setAnimationSteps(state: SiteState, pageId: string, id: string, steps: AnimationStep[]): SiteState {
  return updatePage(state, pageId, (page) => ({
    ...page,
    animations: page.animations?.map((animation) => (animation.id === id ? { ...animation, steps } : animation)),
  }));
}

/** Borra una animación y las interacciones que la reproducían. */
export function deleteAnimation(state: SiteState, pageId: string, id: string): SiteState {
  return updatePage(state, pageId, (page) => ({
    ...page,
    animations: page.animations?.filter((animation) => animation.id !== id),
    blocks: page.blocks.map((block) =>
      block.behaviors?.some((b) => b.action.kind === "play" && b.action.animationId === id)
        ? { ...block, behaviors: block.behaviors.filter((b) => !(b.action.kind === "play" && b.action.animationId === id)) }
        : block,
    ),
  }));
}
