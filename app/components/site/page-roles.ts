/** Páginas con una función propia (carga, 404): el sistema las detecta y las muestra solo, sin colgarlas de otra página. */

import type { SiteState, Page } from "./types";

export type PageRole = "loading" | "not-found" | "skeleton";

/** Las funciones posibles: su nombre y cuándo se muestra. Una nueva es una entrada nueva. */
export const PAGE_ROLES: Record<PageRole, { label: string; hint: string }> = {
  loading: { label: "Carga", hint: "Se muestra al entrar al sitio y al cambiar de página, hasta que la página termina de cargar (con un mínimo y un máximo de 15 s)." },
  "not-found": { label: "No encontrada (404)", hint: "Se muestra cuando un enlace lleva a una página que no existe." },
  skeleton: { label: "Esqueleto", hint: "Se muestra, con un brillo suave, mientras los datos de la página (APIs) todavía están llegando." },
};

export const ROLE_NAMES = Object.keys(PAGE_ROLES) as PageRole[];

export type RoleAction = { type: "page/role"; id: string; role: PageRole | null };

/** La página que cumple una función, si hay una. */
export const pageWithRole = (pages: Page[], role: PageRole): Page | undefined => pages.find((page) => page.role === role);

/**
 * Da una función a una página (o se la quita con `null`). Solo hay una página por función: la anterior vuelve a ser
 * normal. La página de inicio no puede tener función.
 */
export function setPageRole(state: SiteState, id: string, role: PageRole | null): SiteState {
  const target = state.pages.find((page) => page.id === id);
  if (!target || (target.isHome && role !== null)) return state;

  const pages = state.pages.map((page) => {
    if (page.id === id) return { ...page, role: role ?? undefined };
    return role !== null && page.role === role ? { ...page, role: undefined } : page;
  });
  return { ...state, pages };
}

/** Lo que dura la página de carga en pantalla (s): hasta que termina la última de sus animaciones o cuentas. */
export const MIN_LOADING_SECONDS = 0.8;
const NO_ANIMATION_SECONDS = 1.5;

export function loadingSeconds(page: Page): number {
  const behaviors = page.blocks.flatMap((block) => block.behaviors ?? []);
  if (behaviors.length === 0) return NO_ANIMATION_SECONDS;
  const ends = behaviors.map((b) => (b.delay ?? 0) + ("seconds" in b.action ? b.action.seconds : 0.5));
  return Math.max(MIN_LOADING_SECONDS, ...ends);
}

type Handlers = { [K in RoleAction["type"]]: (state: SiteState, action: Extract<RoleAction, { type: K }>) => SiteState };

export const ROLE_HANDLERS: Handlers = {
  "page/role": (state, action) => setPageRole(state, action.id, action.role),
};
