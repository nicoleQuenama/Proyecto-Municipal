import type { GradientTarget } from "./types";
import type { SiteAction, SiteState } from "../site/types";

/** El fondo que tiene ahora el destino (un color o un degradado), si tiene uno. */
export function currentBackground(state: SiteState, target: GradientTarget): string | undefined {
  const page = state.pages.find((p) => p.id === target.pageId);
  if (target.kind === "page") return page?.color;

  const block = page?.blocks.find((b) => b.id === target.blockId);
  if (target.kind === "block") return block?.box?.background;

  const element = state.components.find((c) => c.id === block?.componentId)?.elements.find((e) => e.id === target.elementId);
  return block?.elements?.[target.elementId]?.fill ?? element?.fill;
}

/** La acción que pone ese fondo en el destino: la página, la sección o un elemento. */
export function backgroundAction(target: GradientTarget, background: string): SiteAction {
  if (target.kind === "page") return { type: "page/color", pageId: target.pageId, color: background };
  if (target.kind === "block") return { type: "block/box", pageId: target.pageId, blockId: target.blockId, patch: { background } };
  return { type: "block/style", pageId: target.pageId, blockId: target.blockId, elementIds: [target.elementId], patch: { fill: background } };
}
