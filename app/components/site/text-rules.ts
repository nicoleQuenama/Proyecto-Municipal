/** El contenido de un elemento que se cambia directamente sobre el lienzo: su texto o su icono. */

import type { IconName } from "../icons/icon-set";
import type { SiteState } from "./types";

interface ElementTarget {
  componentId: string;
  pageId: string;
  blockId: string;
  elementId: string;
}

export type TextAction =
  | ({ type: "component/text"; text: string } & ElementTarget)
  | ({ type: "component/icon"; icon: IconName } & ElementTarget);

/** Un texto que se deja vacío vuelve a este, para que el elemento no desaparezca de la página. */
export const EMPTY_TEXT = "Texto";

function patchElement(state: SiteState, componentId: string, elementId: string, patch: { text?: string; icon?: IconName }): SiteState {
  const component = state.components.find((c) => c.id === componentId);
  const element = component?.elements.find((e) => e.id === elementId);
  if (!component || !element) return state;
  if (Object.entries(patch).every(([key, value]) => element[key as keyof typeof element] === value)) return state;

  const elements = component.elements.map((e) => (e.id === elementId ? { ...e, ...patch } : e));
  return { ...state, components: state.components.map((c) => (c.id === componentId ? { ...c, elements } : c)) };
}

export const setElementText = (state: SiteState, componentId: string, elementId: string, text: string): SiteState =>
  patchElement(state, componentId, elementId, { text: text.trim() === "" ? EMPTY_TEXT : text });

export const setElementIcon = (state: SiteState, componentId: string, elementId: string, icon: IconName): SiteState =>
  patchElement(state, componentId, elementId, { icon });

type Handlers = { [K in TextAction["type"]]: (state: SiteState, action: Extract<TextAction, { type: K }>) => SiteState };

export const TEXT_HANDLERS: Handlers = {
  "component/text": (state, action) => setElementText(state, action.componentId, action.elementId, action.text),
  "component/icon": (state, action) => setElementIcon(state, action.componentId, action.elementId, action.icon),
};
