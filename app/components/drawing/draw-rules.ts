/** Crear una figura dibujada en la página: un componente propio de un solo elemento y su bloque ya colocado. */

import { newElement } from "../site/component-templates";
import type { BlockInstance, CanvasElement, ComponentDef, ElementKind, SiteState } from "../site/types";
import type { DrawFrame } from "./draw-plan";

export type DrawAction = { type: "shape/draw" } & DrawShapeInput;

export interface DrawShapeInput {
  pageId: string;
  blockId: string;
  componentId: string;
  kind: ElementKind;
  label: string;
  overrides?: Partial<CanvasElement>;
  frame: DrawFrame;
}

/** Las figuras sin ancho o alto (una línea recta) conservan un mínimo para poder verse y seleccionarse. */
const MIN_SIDE = 8;

export function drawShape(state: SiteState, input: DrawShapeInput): SiteState {
  const { pageId, blockId, componentId, kind, label, overrides, frame } = input;
  if (!state.pages.some((page) => page.id === pageId)) return state;

  const width = Math.max(MIN_SIDE, frame.width);
  const height = Math.max(MIN_SIDE, frame.height);
  const element = newElement(kind, `${componentId}-forma`, {
    ...overrides,
    x: 0,
    y: 0,
    width,
    height,
    ...(frame.flipped ? { flipped: true } : {}),
  });
  const component: ComponentDef = {
    id: componentId,
    name: `Forma · ${label}`,
    description: `${label} dibujado en la página`,
    // Su caja sigue las reglas de «Secciones», como cualquier categoría propia (ver `categories.ts`).
    category: "sections",
    width,
    height,
    elements: [element],
    links: {},
    custom: true,
    drawn: true,
  };
  const block: BlockInstance = { id: blockId, componentId, placement: { x: frame.x, y: frame.y, width } };

  return {
    ...state,
    components: [...state.components, component],
    pages: state.pages.map((page) => (page.id === pageId ? { ...page, blocks: [...page.blocks, block] } : page)),
    currentPageId: pageId,
    selectedId: blockId,
    selectedElementId: null,
    alsoSelectedIds: undefined,
  };
}

/** Quita las figuras dibujadas cuyo bloque ya no existe en ninguna página. */
export function withoutOrphanShapes(state: SiteState): SiteState {
  const used = new Set(state.pages.flatMap((page) => page.blocks.map((block) => block.componentId)));
  const components = state.components.filter((component) => !component.drawn || used.has(component.id));
  return components.length === state.components.length ? state : { ...state, components };
}

type Handlers = { [K in DrawAction["type"]]: (state: SiteState, action: Extract<DrawAction, { type: K }>) => SiteState };

/** Lo que cambia la acción de dibujar una figura en la página. */
export const DRAW_HANDLERS: Handlers = {
  "shape/draw": (state, action) => drawShape(state, action),
};
