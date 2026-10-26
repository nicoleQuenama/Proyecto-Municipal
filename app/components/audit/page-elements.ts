import { applyOverrides } from "../site/overrides";
import type { LinkTarget } from "../navigation/types";
import { computeStyle, resolveValue } from "../styles/resolve";
import { styleComponent } from "../styles/apply";
import type { BlockInstance, CanvasElement, ComponentDef, Page, SiteState } from "../site/types";
import { styleTarget } from "../site/categories";

export const PAGE_BACKGROUND = "#ffffff";

/** Un elemento tal como lo vería el visitante: con estilos, formato del bloque y su fondo real. */
export interface AuditElement {
  block: BlockInstance;
  def: ComponentDef;
  element: CanvasElement;
  /** El color de fondo detrás de él (la forma que lo cubre, la caja de la sección o la página). */
  background: string;
  link?: LinkTarget;
  /** Su texto lo pone una API: no se puede juzgar aquí. */
  bound: boolean;
}

const covers = (shape: CanvasElement, el: CanvasElement) =>
  shape.x <= el.x + 1 && shape.y <= el.y + 1 && shape.x + shape.width >= el.x + el.width - 1 && shape.y + shape.height >= el.y + el.height - 1;

/** Fondo detrás de un elemento: la última forma que lo cubre (más arriba en el orden) o el de la sección. */
function backgroundOf(el: CanvasElement, before: CanvasElement[], sectionBg: string): string {
  const shape = [...before].reverse().find((s) => (s.kind === "rect" || s.kind === "ellipse") && s.fill && covers(s, el));
  return shape ? shape.fill : sectionBg;
}

function blockElements(site: SiteState, page: Page, block: BlockInstance): AuditElement[] {
  const def = site.components.find((c) => c.id === block.componentId);
  if (!def || block.hidden) return [];

  const ctx = { pageId: page.id, componentId: def.id };
  const resolve = (value: string) => resolveValue(value, site.variables, ctx);
  const view = applyOverrides(styleComponent(def, site, page.id), block, resolve);

  const sectionBg =
    (block.box?.background && resolve(block.box.background)) ||
    computeStyle(site, ctx, styleTarget(def.category)).background ||
    computeStyle(site, ctx, "page").background ||
    PAGE_BACKGROUND;

  const visible = view.elements.filter((e) => !e.hidden && !e.removed);
  return visible.map((element, i) => ({
    block,
    def,
    element,
    background: backgroundOf(element, visible.slice(0, i), sectionBg),
    link: def.links[element.id],
    bound: Boolean(block.bindings?.[element.id]),
  }));
}

/** Todos los elementos visibles de una página, ya resueltos. */
export const pageElements = (site: SiteState, page: Page): AuditElement[] =>
  page.blocks.flatMap((block) => blockElements(site, page, block));
