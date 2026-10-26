import { isBackdrop } from "../canvas-editing/backdrop";
import type { CanvasElement, ComponentDef } from "../site/types";
import { readingOrder } from "./menu-model";

/** Aire que queda bajo el título al plegar (px). */
const TITLE_GAP = 8;

/** El título de un acordeón: el elegido o, si no hay (o ya no existe), el primer elemento visible con texto. */
export function accordionTitle(view: ComponentDef, titleId?: string): CanvasElement | undefined {
  const shown = view.elements.filter((element) => !element.hidden);
  const chosen = shown.find((element) => element.id === titleId);
  return chosen ?? shown.filter((element) => element.text.trim() !== "").sort(readingOrder)[0];
}

/** La sección plegada: solo lo que está a la altura del título o por encima; el fondo se acorta con ella. */
export function collapseToTitle(view: ComponentDef, titleId?: string): ComponentDef {
  const title = accordionTitle(view, titleId);
  if (!title) return view;

  const height = Math.min(view.height, title.y + title.height + TITLE_GAP);
  const size = { width: view.width, height: view.height };
  const elements = view.elements
    .filter((element) => isBackdrop(element, size) || element.y + element.height / 2 <= title.y + title.height)
    .map((element) => (isBackdrop(element, size) ? { ...element, height: Math.min(element.height, height) } : element));
  return { ...view, height, elements };
}
