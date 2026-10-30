/** Reglas puras del código propio (clases de Tailwind y CSS) de una sección o elemento. */

import { SECTION_KEY, type BlockInstance, type ComponentDef, type CustomStyle } from "./types";
import { LAYOUT_CLASS } from "../customize/layout-presets";

/** Identifica en el DOM una sección o elemento de un bloque (`data-target`). */
export const targetKey = (blockId: string, key: string) => `${blockId}:${key}`;

/** Quita comentarios y textos entre comillas, donde una llave no cuenta. */
const withoutCommentsAndStrings = (css: string) =>
  css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""');

/**
 * Por qué este CSS no se puede aplicar, o `null` si vale. El CSS se envuelve en la regla de su
 * elemento, así que no puede cerrar esa regla (llaves sin pareja) ni cargar hojas externas (@import).
 */
export function cssProblem(css: string): string | null {
  const clean = withoutCommentsAndStrings(css);
  if (/@import/i.test(clean)) return "No se permite @import.";

  let depth = 0;
  for (const char of clean) {
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth < 0) return "Hay una llave «}» de más.";
  }
  return depth === 0 ? null : "Falta cerrar una llave «{».";
}

/** La regla de un trozo de CSS propio, con el CSS dentro (admite anidar con «&»). Lo no válido se omite. */
const rule = (selector: string, custom: CustomStyle): string =>
  custom.css.trim() && cssProblem(custom.css) === null ? `${selector} {\n${custom.css}\n}` : "";

/** El CSS propio de un bloque, cada trozo limitado a su elemento. */
export function customCss(block: BlockInstance): string {
  return Object.entries(block.custom ?? {})
    .map(([key, custom]) => rule(`[data-target="${targetKey(block.id, key)}"]`, custom))
    .filter(Boolean)
    .join("\n");
}

/**
 * El CSS de todo un componente: vale en cada lugar donde se use. `:where` le quita especificidad, así lo que se
 * escriba en un bloque concreto siempre lo reemplaza.
 */
export function componentCss(def: ComponentDef): string {
  return Object.entries(def.styles ?? {})
    .map(([key, custom]) => {
      const part = key === SECTION_KEY ? "[data-canvas]" : `[data-el="${key}"]`;
      return rule(`:where([data-component="${def.id}"]) :where(${part})`, custom);
    })
    .filter(Boolean)
    .join("\n");
}

/** Las clases de Tailwind de una sección o elemento: las de todo el componente y, encima, las del bloque. */
export const customClasses = (block: BlockInstance, key: string, def?: ComponentDef): string => {
  const defClasses = def?.styles?.[key]?.classes;
  const blockClasses = block.custom?.[key]?.classes;
  if (!defClasses) return blockClasses ?? "";
  if (!blockClasses) return defClasses;

  if (key === SECTION_KEY && blockClasses.split(/\s+/).some((name) => LAYOUT_CLASS.test(name))) {
    const cleanDef = defClasses
      .split(/\s+/)
      .filter((name) => !LAYOUT_CLASS.test(name))
      .join(" ");
    return [cleanDef, blockClasses].filter(Boolean).join(" ");
  }

  return [defClasses, blockClasses].filter(Boolean).join(" ");
};

/** `display: flex` o `grid`, en CSS o con clases: los elementos de la sección se acomodan solos en lugar de ir en su posición. */
const FLOW_CSS = /(^|[;{\s])display\s*:\s*(inline-)?(flex|grid)\b/i;
const FLOW_CLASS = /^(inline-)?(flex|grid)$/;

export const isFlowLayout = (...styles: (CustomStyle | undefined)[]): boolean =>
  styles.some(
    (style) => style && (FLOW_CSS.test(style.css) || style.classes.split(/\s+/).some((name) => FLOW_CLASS.test(name))),
  );
