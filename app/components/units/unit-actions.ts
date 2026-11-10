import type { SiteState } from "../site/types";

/** Las acciones del editor que tienen que ver con las unidades (departamentos). */
export type UnitAction =
  | { type: "unit/set-active"; unitId: string | null }
  | { type: "page/set-unit"; pageId: string; unitId: string | null }
  | { type: "project-media/set-unit"; id: string; unitId: string | null };

type Handlers = { [K in UnitAction["type"]]: (state: SiteState, action: Extract<UnitAction, { type: K }>) => SiteState };

export const UNIT_HANDLERS: Handlers = {
  // Es de la pantalla de cada persona (no se guarda): decide dónde nacen las páginas y los archivos nuevos.
  "unit/set-active": (state, action) => ({ ...state, activeUnitId: action.unitId }),
  "page/set-unit": (state, action) => ({ ...state, pages: state.pages.map((page) => (page.id === action.pageId ? { ...page, unitId: action.unitId } : page)) }),
  "project-media/set-unit": (state, action) => ({ ...state, projectMedia: (state.projectMedia ?? []).map((asset) => (asset.id === action.id ? { ...asset, unitId: action.unitId } : asset)) }),
};
