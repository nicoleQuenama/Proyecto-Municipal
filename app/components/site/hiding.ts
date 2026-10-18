/** Reglas puras para ocultar y mostrar partes del sitio. */

import { styleElements } from "./overrides";
import type { HideTarget, Page, SiteState } from "./types";

function mapPage(state: SiteState, pageId: string, update: (page: Page) => Page): SiteState {
  return { ...state, pages: state.pages.map((page) => (page.id === pageId ? update(page) : page)) };
}

const pageOf = (state: SiteState, pageId: string) => state.pages.find((page) => page.id === pageId);

/** Cómo se oculta, se muestra y se consulta cada tipo de destino. Un destino nuevo es una entrada nueva. */
interface Hider<T extends HideTarget> {
  set: (state: SiteState, target: T, hidden: boolean) => SiteState;
  is: (state: SiteState, target: T) => boolean;
}

const HIDERS: { [K in HideTarget["kind"]]: Hider<Extract<HideTarget, { kind: K }>> } = {
  page: {
    set: (state, target, hidden) => mapPage(state, target.pageId, (page) => ({ ...page, hidden })),
    is: (state, target) => pageOf(state, target.pageId)?.hidden === true,
  },
  title: {
    set: (state, target, hidden) => mapPage(state, target.pageId, (page) => ({ ...page, titleHidden: hidden })),
    is: (state, target) => pageOf(state, target.pageId)?.titleHidden === true,
  },
  block: {
    set: (state, target, hidden) =>
      mapPage(state, target.pageId, (page) => ({
        ...page,
        blocks: page.blocks.map((block) => (block.id === target.blockId ? { ...block, hidden } : block)),
      })),
    is: (state, target) => pageOf(state, target.pageId)?.blocks.find((b) => b.id === target.blockId)?.hidden === true,
  },
  media: {
    set: (state, target, hidden) =>
      mapPage(state, target.pageId, (page) => ({
        ...page,
        media: page.media.map((item) => (item.id === target.mediaId ? { ...item, hidden } : item)),
      })),
    is: (state, target) => pageOf(state, target.pageId)?.media.find((m) => m.id === target.mediaId)?.hidden === true,
  },
  element: {
    // Mostrar quita la marca en lugar de guardar «false».
    set: (state, target, hidden) =>
      styleElements(state, target.pageId, target.blockId, [target.elementId], { hidden: hidden || undefined }),
    is: (state, target) =>
      pageOf(state, target.pageId)?.blocks.find((b) => b.id === target.blockId)?.elements?.[target.elementId]
        ?.hidden === true,
  },
};

// TypeScript no puede relacionar el tipo del destino con su `Hider`, pero `HIDERS` lo garantiza.
const hiderFor = (target: HideTarget) => HIDERS[target.kind] as Hider<HideTarget>;

/** Cambia el indicador `hidden` de lo que apunta `target`. Si no existe, el estado queda igual. */
export const setHidden = (state: SiteState, target: HideTarget, hidden: boolean): SiteState =>
  hiderFor(target).set(state, target, hidden);

/** ¿Está oculto lo que apunta `target`? */
export const isHidden = (state: SiteState, target: HideTarget): boolean => hiderFor(target).is(state, target);
