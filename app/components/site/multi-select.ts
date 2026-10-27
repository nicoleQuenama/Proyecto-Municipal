/** Seleccionar varias secciones a la vez (arrastrando sobre ellas, como en Figma o Canva). */

import { TITLE_SELECTION, type SiteState } from "./types";

/** `pageId`: la página donde están (pasa a ser la actual). */
export type MultiSelectAction = { type: "block/select-many"; ids: string[]; pageId?: string };

/** Las secciones seleccionadas: la lista si la sección activa está en ella, o solo la activa. */
export function selectionOf(state: Pick<SiteState, "selectedId" | "selectedBlockIds">): string[] {
  if (state.selectedBlockIds?.includes(state.selectedId)) return state.selectedBlockIds;
  return state.selectedId === TITLE_SELECTION ? [] : [state.selectedId];
}

/** Deja seleccionadas esas secciones (sin ninguna, quita la selección). */
export function selectBlocks(state: SiteState, ids: string[]): SiteState {
  return {
    ...state,
    selectedId: ids[0] ?? TITLE_SELECTION,
    selectedElementId: null,
    alsoSelectedIds: undefined,
    selectedBlockIds: ids.length > 1 ? ids : undefined,
  };
}

type Handlers = { [K in MultiSelectAction["type"]]: (state: SiteState, action: Extract<MultiSelectAction, { type: K }>) => SiteState };

export const MULTI_SELECT_HANDLERS: Handlers = {
  "block/select-many": (state, action) => ({ ...selectBlocks(state, action.ids), ...(action.pageId ? { currentPageId: action.pageId } : {}) }),
};
