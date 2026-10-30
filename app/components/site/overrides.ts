/**
 * Reglas puras del formato propio de cada bloque: lo que se cambia con el clic derecho
 * (color, negrita, posición, fondo…) o al ocultar un elemento se guarda en el bloque,
 * no en el componente, así que solo afecta a ese bloque.
 */

import { layoutDocked } from "../canvas-editing/dock-layout";
import { clampCanvasSize } from "../canvas-editing/limits";
import { pixelsOf } from "../styles/apply";
import { splitBlocks } from "./rules";
import type {
  BlockBox,
  BlockInstance,
  CanvasElement,
  ComponentDef,
  ElementOverride,
  Page,
  SiteState,
} from "./types";

/** Convierte `var(--nombre)` en su valor; sin variable definida devuelve `undefined`. */
export type Resolver = (value: string) => string | undefined;

/** Las propiedades que pueden ser una variable, y cómo se lee su valor ya resuelto. */
const VARIABLE_PROPS = {
  color: (resolved: string | undefined, fallback: string) => resolved ?? fallback,
  fill: (resolved: string | undefined, fallback: string) => resolved ?? fallback,
  fontFamily: (resolved: string | undefined, fallback: string) => resolved ?? fallback,
  fontSize: (resolved: string | undefined, fallback: number) => pixelsOf(resolved, fallback),
  radius: (resolved: string | undefined, fallback: number) => pixelsOf(resolved, fallback),
} as const;

type VariableProp = keyof typeof VARIABLE_PROPS;

/** El valor final de un cambio: si es una variable se resuelve; si es un literal se deja como está. */
export function resolveOverride(element: CanvasElement, override: ElementOverride, resolve: Resolver): CanvasElement {
  const next: Record<string, unknown> = { ...element, ...override };
  if (override.parentId === null) next.parentId = undefined; // suelto del contenedor que tenía

  for (const prop of Object.keys(VARIABLE_PROPS) as VariableProp[]) {
    const raw = override[prop];
    if (typeof raw !== "string") continue;
    next[prop] = (VARIABLE_PROPS[prop] as (resolved: string | undefined, fallback: unknown) => unknown)(
      resolve(raw),
      element[prop],
    );
  }
  return next as unknown as CanvasElement;
}

/** Soltar un elemento de su contenedor: se queda donde está y deja de seguirlo. */
export const FREE_OF_CONTAINER = { parentId: null, slot: undefined, offset: undefined, fitToParent: undefined } satisfies ElementOverride;

/** El componente tal como se ve en un bloque: con el formato, el tamaño y el acoplado propios del bloque. */
export function applyOverrides(def: ComponentDef, block: BlockInstance, resolve: Resolver): ComponentDef {
  const overrides = block.elements;
  if (!overrides && !block.size) return def;

  // Los elementos eliminados en este bloque no existen en él.
  const elements = def.elements
    .filter((element) => !overrides?.[element.id]?.removed)
    .map((element) => (overrides?.[element.id] ? resolveOverride(element, overrides[element.id], resolve) : element));
  return {
    ...def,
    ...block.size,
    // Lo acoplado sigue a su contenedor aunque el bloque lo haya movido o redimensionado.
    elements: overrides ? layoutDocked(elements) : elements,
  };
}

/** Une un cambio a lo que ya había. Un valor `undefined` quita esa propiedad. */
export function mergePatch<T extends object>(current: T | undefined, patch: Partial<T>): T | undefined {
  const merged: Record<string, unknown> = { ...current, ...patch };
  for (const key of Object.keys(merged)) if (merged[key] === undefined) delete merged[key];
  return Object.keys(merged).length > 0 ? (merged as T) : undefined;
}

export function updateBlock(
  state: SiteState,
  pageId: string,
  blockId: string,
  update: (block: BlockInstance) => BlockInstance,
): SiteState {
  const targetPage =
    state.pages.find((p) => p.id === pageId && p.blocks.some((b) => b.id === blockId)) ??
    state.pages.find((p) => p.blocks.some((b) => b.id === blockId));
  const effectivePageId = targetPage ? targetPage.id : pageId;

  return {
    ...state,
    pages: state.pages.map((page) =>
      page.id === effectivePageId
        ? { ...page, blocks: page.blocks.map((block) => (block.id === blockId ? update(block) : block)) }
        : page,
    ),
  };
}

/** Cambia el formato de varios elementos de un bloque a la vez. */
export function styleElements(
  state: SiteState,
  pageId: string,
  blockId: string,
  elementIds: string[],
  patch: ElementOverride,
): SiteState {
  return updateBlock(state, pageId, blockId, (block) => {
    const elements = { ...block.elements };
    for (const id of elementIds) {
      const merged = mergePatch(elements[id], patch);
      if (merged) elements[id] = merged;
      else delete elements[id];
    }
    return { ...block, elements: Object.keys(elements).length > 0 ? elements : undefined };
  });
}

/** Cambia el tamaño de la sección de un bloque, sin pasar del máximo de pantalla ni dejar elementos fuera. */
export function resizeSection(
  state: SiteState,
  pageId: string,
  blockId: string,
  size: Partial<{ width: number; height: number }>,
  /** El fondo de la sección: crece con ella y no cuenta como contenido que impida achicarla. */
  backdropId?: string,
): SiteState {
  const block = state.pages.find((p) => p.id === pageId)?.blocks.find((b) => b.id === blockId);
  const def = state.components.find((c) => c.id === block?.componentId);
  if (!block || !def) return state;

  const current = applyOverrides(def, block, () => undefined);
  const next = clampCanvasSize(
    { width: size.width ?? current.width, height: size.height ?? current.height },
    current.elements.filter((element) => element.id !== backdropId),
  );
  const unchanged = next.width === def.width && next.height === def.height;
  const resized = updateBlock(state, pageId, blockId, (b) => ({ ...b, size: unchanged ? undefined : next }));
  return backdropId ? styleElements(resized, pageId, blockId, [backdropId], { x: 0, y: 0, ...next }) : resized;
}

/** Cambia el fondo o las esquinas de la caja de un bloque. */
export function styleBox(state: SiteState, pageId: string, blockId: string, patch: BlockBox): SiteState {
  return updateBlock(state, pageId, blockId, (block) => ({ ...block, box: mergePatch(block.box, patch) }));
}

/** Quita todo el formato propio de un bloque; lo que está oculto sigue oculto y lo eliminado, eliminado. */
export function resetFormat(state: SiteState, pageId: string, blockId: string): SiteState {
  return updateBlock(state, pageId, blockId, (block) => {
    const kept = Object.entries(block.elements ?? {}).filter(([, override]) => override.hidden || override.removed || override.alt !== undefined);
    const elements = Object.fromEntries(
      kept.map(([id, o]) => [id, { ...(o.hidden ? { hidden: true } : {}), ...(o.removed ? { removed: true } : {}), ...(o.alt !== undefined ? { alt: o.alt } : {}) }]),
    );
    return { ...block, box: undefined, elements: kept.length > 0 ? elements : undefined };
  });
}

/** Sube (-1) o baja (1) un bloque dentro de su grupo: las barras de navegación van siempre arriba. */
export function moveBlock(state: SiteState, pageId: string, blockId: string, direction: -1 | 1): SiteState {
  const page = state.pages.find((p) => p.id === pageId);
  if (!page) return state;

  const { top, body, bottom } = splitBlocks(page, state.components);
  const group = [top, body, bottom].find((blocks) => blocks.some((block) => block.id === blockId));
  const index = group?.findIndex((block) => block.id === blockId) ?? -1;
  const neighbour = group?.[index + direction];
  if (!group || index < 0 || !neighbour) return state;

  const blocks = [...page.blocks];
  const from = blocks.findIndex((block) => block.id === blockId);
  const to = blocks.findIndex((block) => block.id === neighbour.id);
  [blocks[from], blocks[to]] = [blocks[to], blocks[from]];

  return { ...state, pages: state.pages.map((p): Page => (p.id === pageId ? { ...p, blocks } : p)) };
}

/** Mantiene un elemento dentro de su componente al moverlo. */
export function clampPosition(element: CanvasElement, def: ComponentDef, x: number, y: number) {
  return {
    x: Math.round(Math.min(Math.max(0, x), Math.max(0, def.width - element.width))),
    y: Math.round(Math.min(Math.max(0, y), Math.max(0, def.height - element.height))),
  };
}
