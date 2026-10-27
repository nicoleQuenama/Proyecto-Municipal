import type { SiteState } from "../site/types";
import type { BlockBackground } from "./types";

export type BackgroundAction =
  /** Pone, cambia o (con `undefined`) quita el fondo de imagen o video de una página. */
  | { type: "page/backdrop"; pageId: string; backdrop: BlockBackground | undefined }
  /** Pone o (con `undefined`) quita el color de fondo de una página. */
  | { type: "page/color"; pageId: string; color: string | undefined };

type Handlers = { [K in BackgroundAction["type"]]: (state: SiteState, action: Extract<BackgroundAction, { type: K }>) => SiteState };

export const BACKGROUND_HANDLERS: Handlers = {
  "page/backdrop": (state, { pageId, backdrop }) => ({
    ...state,
    pages: state.pages.map((page) => (page.id === pageId ? { ...page, backdrop } : page)),
  }),
  "page/color": (state, { pageId, color }) => ({
    ...state,
    pages: state.pages.map((page) => (page.id === pageId ? { ...page, color } : page)),
  }),
};
