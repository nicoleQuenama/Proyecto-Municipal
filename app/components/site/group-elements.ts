/** Agrupar elementos en una tarjeta: un contenedor que lleva dentro a los demás, para moverlos y acomodarlos como una pieza. */

import { layoutDocked } from "../canvas-editing/dock-layout";
import type { CanvasElement, ComponentDef, SiteState } from "./types";

export type GroupElementsAction =
  | { type: "elements/group"; componentId: string; elementIds: string[] }
  | { type: "elements/ungroup"; componentId: string; elementId: string };

/** Los contenedores que crea esta herramienta llevan este nombre en su id y no se pintan. */
const CARD_MARK = "-tarjeta-";
const isCard = (element: CanvasElement) => element.id.includes(CARD_MARK) && element.fill === "transparent";

const container = (id: string, box: Pick<CanvasElement, "x" | "y" | "width" | "height">): CanvasElement => ({
  id, kind: "rect", role: "none", ...box, fill: "transparent", radius: 0, text: "", fontSize: 16, color: "#000000",
  bold: false, align: "left", fontFamily: "", src: "", name: "Tarjeta",
});

const update = (state: SiteState, component: ComponentDef, elements: CanvasElement[]): SiteState => ({
  ...state,
  components: state.components.map((c) => (c.id === component.id ? { ...c, elements: layoutDocked(elements) } : c)),
});

export function groupElements(state: SiteState, componentId: string, elementIds: string[]): SiteState {
  const component = state.components.find((c) => c.id === componentId);
  if (!component) return state;
  const picked = component.elements.filter((e) => elementIds.includes(e.id) && e.parentId === undefined);
  if (picked.length < 2) return state;

  const left = Math.min(...picked.map((e) => e.x));
  const top = Math.min(...picked.map((e) => e.y));
  const right = Math.max(...picked.map((e) => e.x + e.width));
  const bottom = Math.max(...picked.map((e) => e.y + e.height));
  const id = `${componentId}${CARD_MARK}${component.elements.length + 1}`;
  const pickedIds = new Set(picked.map((e) => e.id));

  // El contenedor va justo antes del primero, para quedar detrás de lo que lleva dentro.
  const first = component.elements.findIndex((e) => pickedIds.has(e.id));
  const elements = component.elements.flatMap((e, index): CanvasElement[] => {
    const child = pickedIds.has(e.id) ? [{ ...e, parentId: id, offset: { x: e.x - left, y: e.y - top }, slot: undefined, fitToParent: undefined }] : [e];
    return index === first ? [container(id, { x: left, y: top, width: right - left, height: bottom - top }), ...child] : child;
  });
  return update(state, component, elements);
}

export function ungroupElements(state: SiteState, componentId: string, elementId: string): SiteState {
  const component = state.components.find((c) => c.id === componentId);
  const card = component?.elements.find((e) => e.id === elementId);
  if (!component || !card) return state;

  // Cada uno queda donde se ve, ya sin contenedor.
  const free = (e: CanvasElement): CanvasElement => ({ ...e, parentId: undefined, offset: undefined, slot: undefined, fitToParent: undefined });
  const placed = layoutDocked(component.elements);
  const elements = placed.filter((e) => !(e.id === elementId && isCard(e))).map((e) => (e.parentId === elementId ? free(e) : e));
  return update(state, component, elements);
}

type Handlers = { [K in GroupElementsAction["type"]]: (state: SiteState, action: Extract<GroupElementsAction, { type: K }>) => SiteState };

export const GROUP_ELEMENTS_HANDLERS: Handlers = {
  "elements/group": (state, action) => groupElements(state, action.componentId, action.elementIds),
  "elements/ungroup": (state, action) => ungroupElements(state, action.componentId, action.elementId),
};
