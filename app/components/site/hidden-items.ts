/** Lo que una página tiene oculto, y cómo eliminarlo de verdad. Reglas puras. */

import { elementLabel } from "../navigation/links";
import { removeBlocks, removeElements, setTitleRemoved } from "./removal-rules";
import type { ComponentDef, Page, SiteAction, SiteState } from "./types";

export interface HiddenItem {
  /** Clave única dentro de la página. */
  key: string;
  /** «Titular», «Sección · Tarjeta», «Botón «Explorar»»… */
  label: string;
  /** Lo que lo elimina definitivamente. */
  remove: SiteAction;
}

/** Todo lo oculto de una página: titular, secciones, elementos de sus secciones y medios. */
export function hiddenItems(page: Page, components: ComponentDef[]): HiddenItem[] {
  const items: HiddenItem[] = [];
  if (page.titleHidden && !page.titleRemoved) {
    items.push({ key: "title", label: "Titular", remove: { type: "title/removed", pageId: page.id, removed: true } });
  }

  for (const block of page.blocks) {
    const def = components.find((c) => c.id === block.componentId);
    if (!def) continue;
    if (block.hidden) {
      items.push({ key: block.id, label: `Sección · ${def.name}`, remove: { type: "block/remove", id: block.id } });
      continue;
    }
    for (const element of def.elements) {
      const override = block.elements?.[element.id];
      if (!override?.hidden || override.removed) continue;
      items.push({
        key: `${block.id}:${element.id}`,
        label: `${elementLabel(element)} · ${def.name}`,
        remove: { type: "element/remove", scope: "block", pageId: page.id, blockId: block.id, elementIds: [element.id] },
      });
    }
  }

  for (const item of page.media) {
    if (item.hidden) items.push({ key: item.id, label: `Medio · ${item.name}`, remove: { type: "media/remove", id: item.id } });
  }
  return items;
}

/** Elimina de golpe todo lo oculto de una página. */
export function purgeHidden(state: SiteState, pageId: string): SiteState {
  const page = state.pages.find((p) => p.id === pageId);
  if (!page) return state;

  let next = page.titleHidden ? setTitleRemoved(state, pageId, true) : state;
  next = removeBlocks(next, page.blocks.filter((b) => b.hidden).map((b) => b.id));

  for (const block of page.blocks) {
    const hiddenIds = Object.entries(block.elements ?? {}).filter(([, o]) => o.hidden && !o.removed).map(([id]) => id);
    if (!block.hidden && hiddenIds.length > 0) next = removeElements(next, "block", pageId, block.id, hiddenIds);
  }
  return {
    ...next,
    pages: next.pages.map((p) => (p.id === pageId ? { ...p, media: p.media.filter((m) => !m.hidden) } : p)),
  };
}
