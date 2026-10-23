import type { ExternalAction, ExternalState } from "./types";

export const INITIAL_EXTERNAL: ExternalState = {
  site: null,
  pageUrl: "",
  html: null,
  autoResponsive: true,
  patches: [],
  pages: [],
};

/** Guarda un elemento de una lista por id: reemplaza el que ya estaba o lo añade al final. */
const upsert = <T extends { id: string }>(list: T[], item: T): T[] =>
  list.some((other) => other.id === item.id) ? list.map((other) => (other.id === item.id ? item : other)) : [...list, item];

type Handlers = {
  [K in ExternalAction["type"]]: (state: ExternalState, action: Extract<ExternalAction, { type: K }>) => ExternalState;
};

const HANDLERS: Handlers = {
  // Conectar otro sitio empieza de cero; el mismo sitio conserva sus cambios.
  "site/connect": (state, { site, pageUrl, html }) =>
    state.site === site
      ? { ...state, pageUrl, html }
      : { ...INITIAL_EXTERNAL, autoResponsive: state.autoResponsive, site, pageUrl, html },
  "site/load": (state, { pageUrl, html }) => ({ ...state, pageUrl, html }),
  "site/disconnect": () => INITIAL_EXTERNAL,
  "site/auto-responsive": (state, { on }) => ({ ...state, autoResponsive: on }),
  "patch/save": (state, { patch }) => ({ ...state, patches: upsert(state.patches, patch) }),
  "patch/remove": (state, { id }) => ({ ...state, patches: state.patches.filter((p) => p.id !== id) }),
  "added-page/save": (state, { page }) => ({ ...state, pages: upsert(state.pages, page) }),
  "added-page/remove": (state, { id }) => ({ ...state, pages: state.pages.filter((p) => p.id !== id) }),
};

export function externalReducer(state: ExternalState, action: ExternalAction): ExternalState {
  const handle = HANDLERS[action.type] as (state: ExternalState, action: ExternalAction) => ExternalState;
  return handle(state, action);
}
