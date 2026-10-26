import type { EditScope } from "../canvas-editing/settings-context";
import { TITLE_SELECTION, type Page, type SiteAction } from "./types";

interface Selection {
  selectedId: string;
  selectedElementId: string | null;
  alsoSelectedIds?: string[];
}

/**
 * Qué elimina Supr con lo que hay seleccionado: los elementos (según el alcance elegido), o la sección entera
 * si no hay elemento. El titular no se elimina con el teclado. `null` si no hay nada que eliminar.
 */
export function deletionPlan(page: Page, selection: Selection, scope: EditScope): SiteAction | null {
  const block = page.blocks.find((b) => b.id === selection.selectedId);
  if (selection.selectedId === TITLE_SELECTION || !block) return null;
  if (selection.selectedElementId === null) return { type: "block/remove", id: block.id };

  const elementIds = [...new Set([selection.selectedElementId, ...(selection.alsoSelectedIds ?? [])])];
  return { type: "element/remove", scope, pageId: page.id, blockId: block.id, elementIds };
}
