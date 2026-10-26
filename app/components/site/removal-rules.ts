/** Reglas puras para eliminar de verdad: bloques, componentes, elementos y el titular. */

import { withoutOrphanShapes } from "../drawing/draw-rules";
import { releasedFrames, withoutElements as withoutElementsIn } from "../canvas-editing/dock-release";
import { withoutScope } from "../styles/mutations";
import { clearSelection, dropBlockTargets, dropElementRefs, dropElementTargets, omitKeys } from "./removal-cleanup";
import { FREE_OF_CONTAINER, applyOverrides, styleElements, updateBlock } from "./overrides";
import type { ComponentDef, Page, SiteState } from "./types";

/** Quita bloques (en cualquier página) y todo lo que apuntaba a ellos. */
export function removeBlocks(state: SiteState, blockIds: string[]): SiteState {
  const ids = new Set(blockIds);
  const pages = state.pages.map((page): Page => ({ ...page, blocks: page.blocks.filter((b) => !ids.has(b.id)) }));
  // Una figura dibujada vive solo mientras viva su bloque.
  return withoutOrphanShapes(clearSelection(dropBlockTargets({ ...state, pages }, ids), ids));
}

/** Elimina un componente (de fábrica o propio): sus bloques salen de todas las páginas y sus reglas de estilo con él. */
export function removeComponent(state: SiteState, componentId: string): SiteState {
  if (!state.components.some((c) => c.id === componentId)) return state;

  const blockIds = state.pages.flatMap((p) => p.blocks.filter((b) => b.componentId === componentId).map((b) => b.id));
  const cleaned = removeBlocks(state, blockIds);
  return {
    ...cleaned,
    ...withoutScope(cleaned, { kind: "component", componentId }),
    components: cleaned.components.filter((c) => c.id !== componentId),
  };
}

/** Quita elementos del componente; los que estaban acoplados a ellos quedan sueltos donde se veían. */
function withoutElements(def: ComponentDef, ids: Set<string>): ComponentDef {
  const elements = withoutElementsIn(def.elements, ids);
  return { ...def, elements, links: omitKeys(def.links, ids) ?? {}, styles: omitKeys(def.styles, ids) };
}

/** Elimina elementos de todo el componente: desaparecen de todos los bloques que lo usan, con sus enlaces y datos. */
function removeFromComponent(state: SiteState, componentId: string, ids: Set<string>): SiteState {
  const blockIds = new Set(
    state.pages.flatMap((p) => p.blocks.filter((b) => b.componentId === componentId).map((b) => b.id)),
  );
  const pages = state.pages.map(
    (page): Page => ({
      ...page,
      blocks: page.blocks.map((block) =>
        block.componentId === componentId
          ? { ...dropElementRefs(block, ids), elements: omitKeys(block.elements, ids) }
          : block,
      ),
    }),
  );
  const components = state.components.map((def) => (def.id === componentId ? withoutElements(def, ids) : def));
  return dropElementTargets({ ...state, pages, components }, blockIds, ids);
}

/** Elimina elementos solo de un bloque: ahí dejan de existir; el componente y los demás bloques siguen igual. */
function removeFromBlock(state: SiteState, pageId: string, blockId: string, ids: Set<string>): SiteState {
  // Lo acoplado a lo eliminado se queda suelto en el sitio donde se veía en este bloque.
  const block = state.pages.find((p) => p.id === pageId)?.blocks.find((b) => b.id === blockId);
  const def = state.components.find((c) => c.id === block?.componentId);
  const frames = block && def ? releasedFrames(applyOverrides(def, block, () => undefined).elements, ids) : {};
  let released = state;
  for (const [id, frame] of Object.entries(frames)) {
    released = styleElements(released, pageId, blockId, [id], { ...FREE_OF_CONTAINER, ...frame });
  }
  const marked = styleElements(released, pageId, blockId, [...ids], { removed: true, hidden: undefined });
  const cleaned = updateBlock(marked, pageId, blockId, (block) => dropElementRefs(block, ids));
  return dropElementTargets(cleaned, new Set([blockId]), ids);
}

/** Elimina elementos según el alcance elegido y deja la selección limpia. */
export function removeElements(
  state: SiteState,
  scope: "block" | "component",
  pageId: string,
  blockId: string,
  elementIds: string[],
): SiteState {
  const block = state.pages.find((p) => p.id === pageId)?.blocks.find((b) => b.id === blockId);
  if (!block || elementIds.length === 0) return state;

  const ids = new Set(elementIds);
  const next =
    scope === "component"
      ? removeFromComponent(state, block.componentId, ids)
      : removeFromBlock(state, pageId, blockId, ids);
  return { ...next, selectedElementId: null, alsoSelectedIds: undefined };
}

/** Elimina el titular de una página (o lo devuelve): eliminado, tampoco queda oculto ni con sitio libre. */
export function setTitleRemoved(state: SiteState, pageId: string, removed: boolean): SiteState {
  const pages = state.pages.map(
    (page): Page =>
      page.id === pageId
        ? {
            ...page,
            titleRemoved: removed || undefined,
            titleHidden: undefined,
            titlePlacement: removed ? undefined : page.titlePlacement,
          }
        : page,
  );
  return { ...state, pages };
}
