/** Los manejadores del componente entero: su tamaño y categoría, la plantilla, los enlaces y la selección. */

import { clampCanvasSize } from "../canvas-editing/limits";
import { templateById } from "../site/component-templates";
import { targetsPage } from "../navigation/links";
import type { Handlers } from "./builder-types";

export const CANVAS_HANDLERS: Handlers<"meta" | "template" | "link" | "select"> = {
  meta: (state, action) => {
    const { patch } = action;
    const size = clampCanvasSize(
      { width: patch.width ?? state.width, height: patch.height ?? state.height },
      state.elements,
    );
    return { ...state, ...patch, ...size };
  },

  template: (state, action) => {
    const template = templateById(action.templateId);
    const elements = template.build(action.nextId);
    const links = Object.fromEntries(
      Object.entries(template.links?.(elements) ?? {}).filter(
        ([, link]) => !targetsPage(link) || action.pageIds.includes(link.pageId),
      ),
    );
    return { ...state, width: template.width, height: template.height, elements, links, selectedId: null };
  },

  link: (state, action) => {
    const links = { ...state.links };
    if (action.link) links[action.id] = action.link;
    else delete links[action.id];
    return { ...state, links };
  },

  select: (state, action) => ({ ...state, selectedId: action.id }),
};
