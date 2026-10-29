/** Reglas puras del sitio: nombres, rutas y duplicados. */

import { remapLinks } from "../navigation/links";
import type { BlockInstance, CanvasElement, ComponentDef, Page } from "./types";

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
export const routeOf = (page: Page): string => (page.isHome ? "/" : (page.route ?? `/${page.slug}`));

/** Copia un componente con ids nuevos (para duplicarlo sin compartir elementos). */
export function duplicateComponent(def: ComponentDef, id: string, name: string): ComponentDef {
  const idMap: Record<string, string> = {};
  const elements = def.elements.map((element: CanvasElement, index) => {
    idMap[element.id] = `${id}-e${index + 1}`;
    return { ...element, id: idMap[element.id] };
  });

  return { ...def, id, name, custom: true, elements, links: remapLinks(def.links, idMap) };
}

export interface SplitBlocksResult {
  top: BlockInstance[];
  body: BlockInstance[];
  bottom: BlockInstance[];
}

/**
 * Determina el rol/ubicación de un bloque: encabezado (header), cuerpo (body) o pie de página (footer).
 */
export function getBlockSlot(block: BlockInstance, component?: ComponentDef): "header" | "body" | "footer" {
  if (block.slot) return block.slot;
  if (!component) return "body";
  if (component.category === "navigation") {
    const text = `${component.id} ${component.name}`.toLowerCase();
    const isFooter = text.includes("footer") || text.includes("pie");
    return isFooter ? "footer" : "header";
  }
  return "body";
}

/**
 * Las barras de navegación y encabezados van arriba de la página, antes del titular (top);
 * el contenido va en el centro (body); y los pies de página van al final (bottom).
 * Si la página no tiene encabezado o pie propio, puede heredar los globales de otra página.
 * Si la página tiene hideHeader o hideFooter, esa zona se oculta.
 */
export function splitBlocks(
  page: Page,
  components: ComponentDef[],
  allPages?: Page[],
): SplitBlocksResult {
  const getSlot = (b: BlockInstance) => {
    const comp = components.find((c) => c.id === b.componentId);
    return getBlockSlot(b, comp);
  };

  let top = page.blocks.filter((b) => getSlot(b) === "header");
  const body = page.blocks.filter((b) => getSlot(b) === "body");
  let bottom = page.blocks.filter((b) => getSlot(b) === "footer");

  if (page.hideHeader) {
    top = [];
  } else if (top.length === 0 && allPages && allPages.length > 0) {
    const home = allPages.find((p) => p.isHome) ?? allPages[0];
    const candidatePages = [home, ...allPages.filter((p) => p.id !== home.id)];
    for (const other of candidatePages) {
      if (other.id === page.id) continue;
      const globalHeader = other.blocks.find((b) => {
        const slot = getSlot(b);
        return slot === "header" && (b.scope === "global" || (b.scope !== "page" && other.isHome));
      });
      if (globalHeader) {
        top = [globalHeader];
        break;
      }
    }
  }

  if (page.hideFooter) {
    bottom = [];
  } else if (bottom.length === 0 && allPages && allPages.length > 0) {
    const home = allPages.find((p) => p.isHome) ?? allPages[0];
    const candidatePages = [home, ...allPages.filter((p) => p.id !== home.id)];
    for (const other of candidatePages) {
      if (other.id === page.id) continue;
      const globalFooter = other.blocks.find((b) => {
        const slot = getSlot(b);
        return slot === "footer" && (b.scope === "global" || (b.scope !== "page" && other.isHome));
      });
      if (globalFooter) {
        bottom = [globalFooter];
        break;
      }
    }
  }

  return { top, body, bottom };
}
