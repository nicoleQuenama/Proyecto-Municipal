"use client";

import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { INITIAL_SITE } from "./initial-site";
import { siteReducer } from "./site-reducer";
import type { Page, SiteAction, SiteState } from "./types";

// El estado y el dispatch van en contextos separados: quien solo dispara acciones
// no se vuelve a renderizar cuando cambia el sitio.
const StateContext = createContext<SiteState | null>(null);
const DispatchContext = createContext<Dispatch<SiteAction> | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(siteReducer, INITIAL_SITE);
  return (
    <StateContext value={state}>
      <DispatchContext value={dispatch}>{children}</DispatchContext>
    </StateContext>
  );
}

export function useSite(): SiteState {
  const state = useContext(StateContext);
  if (!state) throw new Error("Debe usarse dentro de <SiteProvider>");
  return state;
}

export function useSiteDispatch(): Dispatch<SiteAction> {
  const dispatch = useContext(DispatchContext);
  if (!dispatch) throw new Error("Debe usarse dentro de <SiteProvider>");
  return dispatch;
}

/** La página que se está editando ahora mismo. */
export function useCurrentPage(): Page {
  const site = useSite();
  return site.pages.find((page) => page.id === site.currentPageId) ?? site.pages[0];
}
