import type { ComponentDef, CustomStyle, Page } from "../site/types";

const hasClasses = (styles: Record<string, CustomStyle> | undefined) =>
  Object.values(styles ?? {}).some((style) => style.classes.trim() !== "");

/**
 * ¿Hay que cargar el Tailwind del navegador? Sí si alguna sección o componente tiene clases propias, o si una página
 * tiene código TypeScript: ese código corre dentro de la página y puede crear elementos con clases de Tailwind.
 */
export const needsTailwind = (pages: Page[], components: ComponentDef[]): boolean =>
  pages.some((page) => (page.js ?? "").trim() !== "" || page.blocks.some((block) => hasClasses(block.custom))) ||
  components.some((def) => hasClasses(def.styles));
