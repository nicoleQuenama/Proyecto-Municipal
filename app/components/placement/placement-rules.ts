/** Reglas puras de la posición libre en la página: colocar y llevar a otra página bloques, titular y medios. */

import { updateBlock } from "../site/overrides";
import type { Page, SiteState } from "../site/types";
import type { Placement } from "./types";

/** Cambia una página y deja el resto igual. */
const updatePage = (state: SiteState, pageId: string, update: (page: Page) => Page): SiteState => ({
  ...state,
  pages: state.pages.map((page) => (page.id === pageId ? update(page) : page)),
});

export const placeBlock = (state: SiteState, pageId: string, blockId: string, placement: Placement): SiteState =>
  updateBlock(state, pageId, blockId, (block) => ({ ...block, placement }));

export const placeTitle = (state: SiteState, pageId: string, placement: Placement): SiteState =>
  updatePage(state, pageId, (page) => ({ ...page, titlePlacement: placement }));

export const placeMedia = (state: SiteState, pageId: string, mediaId: string, placement: Placement): SiteState =>
  updatePage(state, pageId, (page) => ({
    ...page,
    media: page.media.map((item) => (item.id === mediaId ? { ...item, placement } : item)),
  }));

/**
 * Pasa un elemento de una página a otra, ya colocado. La página de destino pasa a ser la actual para que se
 * vea lo que se movió.
 */
function transfer<T extends { id: string }>(
  state: SiteState,
  fromPageId: string,
  toPageId: string,
  itemId: string,
  list: (page: Page) => T[],
  withList: (page: Page, items: T[]) => Page,
  place: (item: T) => T,
): SiteState {
  const source = state.pages.find((page) => page.id === fromPageId);
  const item = source && list(source).find((i) => i.id === itemId);
  if (!item || fromPageId === toPageId || !state.pages.some((page) => page.id === toPageId)) return state;

  const moved = place(item);
  return {
    ...state,
    pages: state.pages.map((page) => {
      if (page.id === fromPageId) return withList(page, list(page).filter((i) => i.id !== itemId));
      if (page.id === toPageId) return withList(page, [...list(page), moved]);
      return page;
    }),
    currentPageId: toPageId,
  };
}

export const transferBlock = (
  state: SiteState,
  fromPageId: string,
  toPageId: string,
  blockId: string,
  placement: Placement,
): SiteState => {
  const next = transfer(
    state,
    fromPageId,
    toPageId,
    blockId,
    (page) => page.blocks,
    (page, blocks) => ({ ...page, blocks }),
    (block) => ({ ...block, placement }),
  );
  return next === state ? state : { ...next, selectedId: blockId, selectedElementId: null };
};

export const transferMedia = (
  state: SiteState,
  fromPageId: string,
  toPageId: string,
  mediaId: string,
  placement: Placement,
): SiteState =>
  transfer(
    state,
    fromPageId,
    toPageId,
    mediaId,
    (page) => page.media,
    (page, media) => ({ ...page, media }),
    (item) => ({ ...item, placement }),
  );
