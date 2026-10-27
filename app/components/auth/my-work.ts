import type { Scope } from "./access";

interface PageLike {
  id: string;
  name: string;
  blocks: { id: string; componentId: string }[];
}

/** Lo que una persona con acceso limitado puede cambiar en una página. */
export interface PageWork {
  pageId: string;
  pageName: string;
  /** La página entera es suya; si no, solo las secciones listadas. */
  whole: boolean;
  blocks: { id: string; label: string }[];
}

/**
 * Las páginas y secciones asignadas a alguien, en el orden del proyecto. Sin límite (`null`) no hay nada que listar:
 * puede tocar todo. Las páginas donde no tiene nada no aparecen.
 */
export function workOf(scope: Scope | null | undefined, pages: PageLike[], nameOf: (componentId: string) => string): PageWork[] {
  if (!scope) return [];
  return pages
    .map((page): PageWork => {
      const whole = scope.pageIds.includes(page.id);
      const mine = page.blocks
        .map((block, index) => ({ id: block.id, label: `${index + 1}. ${nameOf(block.componentId)}` }))
        .filter((block) => whole || scope.blockIds.includes(block.id));
      return { pageId: page.id, pageName: page.name, whole, blocks: mine };
    })
    .filter((work) => work.whole || work.blocks.length > 0);
}

/** ¿Hay algo en esta página que la persona pueda cambiar? Sin límite, siempre. */
export const hasWorkIn = (scope: Scope | null | undefined, pageId: string, works: PageWork[]): boolean =>
  !scope || works.some((work) => work.pageId === pageId);
