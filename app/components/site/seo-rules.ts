import type { Page, SiteState } from "./types";

/** Datos para buscadores y redes de una página; lo que falta lo completa el publicador. */
export interface PageSeo {
  title?: string;
  description?: string;
  /** URL de la imagen que se ve al compartir la página. */
  image?: string;
  /** Idioma de la página («es», «en»…). */
  lang?: string;
}

export type SeoAction =
  | { type: "page/seo"; pageId: string; patch: Partial<PageSeo> }
  | { type: "media/alt"; pageId: string; mediaId: string; alt: string };

type Handlers = { [K in SeoAction["type"]]: (state: SiteState, action: Extract<SeoAction, { type: K }>) => SiteState };

const mapPage = (state: SiteState, pageId: string, update: (page: Page) => Page): SiteState => ({
  ...state,
  pages: state.pages.map((page) => (page.id === pageId ? update(page) : page)),
});

/** Lo que cambia cada acción de SEO y accesibilidad de la página. */
export const SEO_HANDLERS: Handlers = {
  "page/seo": (state, { pageId, patch }) => mapPage(state, pageId, (page) => ({ ...page, seo: { ...page.seo, ...patch } })),

  "media/alt": (state, { pageId, mediaId, alt }) =>
    mapPage(state, pageId, (page) => ({
      ...page,
      media: page.media.map((item) => (item.id === mediaId ? { ...item, alt } : item)),
    })),
};
