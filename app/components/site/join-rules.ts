/** Unir varias secciones en una sola (un grupo): se mueven, se copian y se borran juntas. */

import { withoutOrphanShapes } from "../drawing/draw-rules";
import type { Behavior } from "../behaviors/types";
import { selectBlocks } from "./multi-select";
import { SECTION_KEY, type BlockInstance, type CanvasElement, type ComponentDef, type SiteState } from "./types";

export type JoinAction = { type: "blocks/join"; pageId: string; blockIds: string[]; blockId: string; componentId: string };

interface Part {
  block: BlockInstance;
  def: ComponentDef;
  size: { width: number; height: number };
}

/** El formato propio de una sección sobre sus elementos; lo que apunta a una variable (no es un número) se deja como estaba. */
function formatted(element: CanvasElement, override: BlockInstance["elements"] extends infer R ? (R extends Record<string, infer O> ? O | undefined : never) : never): CanvasElement {
  if (!override) return element;
  const { radius, fontSize, parentId, ...plain } = override;
  return {
    ...element,
    ...plain,
    ...(typeof radius === "number" ? { radius } : {}),
    ...(typeof fontSize === "number" ? { fontSize } : {}),
    ...(parentId === null ? { parentId: undefined } : parentId ? { parentId } : {}),
  };
}

const partsOf = (state: SiteState, pageId: string, blockIds: string[]): Part[] | null => {
  const page = state.pages.find((p) => p.id === pageId);
  const parts: Part[] = [];
  for (const block of page?.blocks ?? []) {
    if (!blockIds.includes(block.id)) continue;
    const def = state.components.find((c) => c.id === block.componentId);
    if (!def || !block.placement || block.code) return null; // solo se unen las secciones colocadas en la página
    parts.push({ block, def, size: block.size ?? { width: def.width, height: def.height } });
  }
  return parts.length >= 2 ? parts : null;
};

/**
 * Une las secciones en un componente nuevo que ocupa el rectángulo que las contiene. Cada elemento conserva su
 * lugar, su formato propio y sus interacciones; los ids se prefijan con el de su sección para no chocar.
 */
export function joinBlocks(state: SiteState, pageId: string, blockIds: string[], blockId: string, componentId: string): SiteState {
  const parts = partsOf(state, pageId, blockIds);
  if (!parts) return state;

  const left = Math.min(...parts.map((p) => p.block.placement!.x));
  const top = Math.min(...parts.map((p) => p.block.placement!.y));
  const right = Math.max(...parts.map((p) => p.block.placement!.x + p.size.width));
  const bottom = Math.max(...parts.map((p) => p.block.placement!.y + p.size.height));

  const elements: CanvasElement[] = [];
  const links: ComponentDef["links"] = {};
  const behaviors: Behavior[] = [];
  for (const { block, def } of parts) {
    const prefix = (id: string) => `${block.id}-${id}`;
    const dx = block.placement!.x - left;
    const dy = block.placement!.y - top;
    for (const element of def.elements) {
      const own = block.elements?.[element.id];
      if (own?.removed) continue;
      const merged = formatted(element, own);
      elements.push({ ...merged, id: prefix(element.id), x: merged.x + dx, y: merged.y + dy, ...(merged.parentId ? { parentId: prefix(merged.parentId) } : {}) });
    }
    for (const [id, link] of Object.entries(def.links)) links[prefix(id)] = link;
    for (const behavior of block.behaviors ?? []) {
      if (behavior.scope !== SECTION_KEY) behaviors.push({ ...behavior, id: crypto.randomUUID(), scope: prefix(behavior.scope) });
    }
  }

  const component: ComponentDef = {
    id: componentId,
    name: "Grupo",
    description: `${parts.length} secciones unidas`,
    category: "sections",
    width: right - left,
    height: bottom - top,
    elements,
    links,
    custom: true,
    drawn: true,
  };
  const joined: BlockInstance = {
    id: blockId,
    componentId,
    placement: { x: left, y: top, width: right - left },
    ...(behaviors.length > 0 ? { behaviors } : {}),
  };

  const removed = new Set(parts.map((p) => p.block.id));
  const next: SiteState = {
    ...state,
    components: [...state.components, component],
    pages: state.pages.map((page) =>
      page.id === pageId ? { ...page, blocks: [...page.blocks.filter((b) => !removed.has(b.id)), joined] } : page,
    ),
  };
  return selectBlocks(withoutOrphanShapes(next), [blockId]);
}

type Handlers = { [K in JoinAction["type"]]: (state: SiteState, action: Extract<JoinAction, { type: K }>) => SiteState };

export const JOIN_HANDLERS: Handlers = {
  "blocks/join": (state, action) => joinBlocks(state, action.pageId, action.blockIds, action.blockId, action.componentId),
};
