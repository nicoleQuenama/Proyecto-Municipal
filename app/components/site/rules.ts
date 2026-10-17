/** Reglas puras del sitio: nombres, rutas y duplicados. */

import { remapLinks } from "../navigation/links";
import type { CanvasElement, ComponentDef, Page } from "./types";

/** "Trámites en línea" → "tramites-en-linea" */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Si la ruta ya existe agrega -2, -3… hasta que sea única. */
export function uniqueSlug(base: string, taken: string[]): string {
  const root = base || "pagina";
  if (!taken.includes(root)) return root;

  let suffix = 2;
  while (taken.includes(`${root}-${suffix}`)) suffix += 1;
  return `${root}-${suffix}`;
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export const isPageNameTaken = (pages: Page[], name: string, exceptId?: string): boolean =>
  pages.some((page) => page.id !== exceptId && sameName(page.name, name));

export const isComponentNameTaken = (
  components: ComponentDef[],
  name: string,
  exceptId?: string,
): boolean => components.some((c) => c.id !== exceptId && sameName(c.name, name));

/** Ruta visible de una página: la de inicio es "/". */
export const routeOf = (page: Page): string => (page.isHome ? "/" : `/${page.slug}`);

/** Copia un componente con ids nuevos (para duplicarlo sin compartir elementos). */
export function duplicateComponent(def: ComponentDef, id: string, name: string): ComponentDef {
  const idMap: Record<string, string> = {};
  const elements = def.elements.map((element: CanvasElement, index) => {
    idMap[element.id] = `${id}-e${index + 1}`;
    return { ...element, id: idMap[element.id] };
  });

  return { ...def, id, name, custom: true, elements, links: remapLinks(def.links, idMap) };
}

/**
 * Las barras de navegación van siempre arriba de la página, antes del titular;
 * el resto de bloques va debajo. Cada grupo conserva el orden en que se añadió.
 */
export function splitBlocks(page: Page, components: ComponentDef[]) {
  const isNavigation = (componentId: string) =>
    components.find((c) => c.id === componentId)?.category === "navigation";

  return {
    top: page.blocks.filter((block) => isNavigation(block.componentId)),
    body: page.blocks.filter((block) => !isNavigation(block.componentId)),
  };
}
