import type { SiteState } from "../site/types";
import type { BlockBackground } from "./types";

export type BackgroundAction =
  /** Pone, cambia o (con `undefined`) quita el fondo de imagen o video de una página. */
  { type: "page/backdrop"; pageId: string; backdrop: BlockBackground | undefined };

type Handlers = { [K in BackgroundAction["type"]]: (state: SiteState, action: Extract<BackgroundAction, { type: K }>) => SiteState };

export const BACKGROUND_HANDLERS: Handlers = {
  "page/backdrop": (state, { pageId, backdrop }) => ({
    ...state,
    pages: state.pages.map((page) => (page.id === pageId ? { ...page, backdrop } : page)),
  }),
};
