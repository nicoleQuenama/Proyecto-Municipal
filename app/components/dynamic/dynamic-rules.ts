import { updateBlock } from "../site/overrides";
import type { SiteState } from "../site/types";
import { normalizeRoute, paramsOf } from "./route-params";
import type { LinkParamValue } from "./types";

export type DynamicAction =
  /** Convierte una página en dinámica (ruta con `:parámetros`) o, con `null`, la vuelve normal. */
  | { type: "page/route"; id: string; route: string | null }
  | { type: "page/preview-param"; id: string; param: string; value: string }
  | { type: "link-param/set"; pageId: string; blockId: string; elementId: string; param: string; value: LinkParamValue | null };

type Handlers = { [K in DynamicAction["type"]]: (state: SiteState, action: Extract<DynamicAction, { type: K }>) => SiteState };

const mapPage = (state: SiteState, id: string, update: (page: SiteState["pages"][number]) => SiteState["pages"][number]): SiteState => ({
  ...state,
  pages: state.pages.map((page) => (page.id === id ? update(page) : page)),
});

/** Lo que cambia cada acción de las páginas dinámicas. */
export const DYNAMIC_HANDLERS: Handlers = {
  "page/route": (state, { id, route }) =>
    mapPage(state, id, (page) => {
      const clean = route === null || page.isHome ? null : normalizeRoute(route);
      if (clean === null) return { ...page, route: undefined, previewParams: undefined };
      // Los ejemplos de parámetros que ya no están en la ruta se descartan.
      const kept = Object.entries(page.previewParams ?? {}).filter(([name]) => paramsOf(clean).includes(name));
      return { ...page, route: clean, previewParams: kept.length > 0 ? Object.fromEntries(kept) : undefined };
    }),

  "page/preview-param": (state, { id, param, value }) =>
    mapPage(state, id, (page) => ({ ...page, previewParams: { ...page.previewParams, [param]: value } })),

  "link-param/set": (state, { pageId, blockId, elementId, param, value }) =>
    updateBlock(state, pageId, blockId, (block) => {
      const element = { ...block.linkParams?.[elementId] };
      if (value === null || value === "") delete element[param];
      else element[param] = value;
      const linkParams = { ...block.linkParams, [elementId]: element };
      if (Object.keys(element).length === 0) delete linkParams[elementId];
      return { ...block, linkParams: Object.keys(linkParams).length > 0 ? linkParams : undefined };
    }),
};
