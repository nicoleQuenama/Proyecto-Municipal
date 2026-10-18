/**
 * Las variables del proyecto como variables CSS y como utilidades de Tailwind, para llamarlas desde el CSS
 * y las clases que escribe el usuario: `var(--color-primario)`, `bg-primario`, `text-primario`…
 */

import type { StyleScope, Variable } from "./types";

const declarations = (variables: Variable[]) => variables.map((v) => `  --${v.name}: ${v.value};`).join("\n");

/** Cómo se elige, en la página del sitio, a quién afecta cada tipo de alcance. */
const HOST_SELECTORS: { [K in StyleScope["kind"]]: (scope: Extract<StyleScope, { kind: K }>) => string } = {
  global: () => "[data-site-page]",
  page: (scope) => `[data-page-id="${scope.pageId}"] [data-site-page]`,
  component: (scope) => `[data-component="${scope.componentId}"]`,
};

const hostSelector = (scope: StyleScope): string =>
  (HOST_SELECTORS[scope.kind] as (scope: StyleScope) => string)(scope);

/**
 * Las variables dentro del sitio del editor. Van acotadas a las páginas (no a `:root`)
 * para que no puedan pisar las variables del propio editor.
 */
export function hostVariablesCss(variables: Variable[]): string {
  const bySelector = new Map<string, Variable[]>();
  for (const variable of variables) {
    const selector = hostSelector(variable.scope);
    bySelector.set(selector, [...(bySelector.get(selector) ?? []), variable]);
  }
  return [...bySelector].map(([selector, list]) => `${selector} {\n${declarations(list)}\n}`).join("\n");
}

/** Las variables de todo el sitio para `@theme` de Tailwind: `--color-primario` da `bg-primario`, `text-primario`… */
export function themeCss(variables: Variable[]): string {
  const global = variables.filter((v) => v.scope.kind === "global");
  return global.length > 0 ? `@theme static {\n${declarations(global)}\n}` : "";
}

/** Las variables de todo el sitio dentro de un iframe aislado (un bloque de código), donde `:root` es suyo. */
export function rootVariablesCss(variables: Variable[]): string {
  const global = variables.filter((v) => v.scope.kind === "global");
  return global.length > 0 ? `:root {\n${declarations(global)}\n}` : "";
}
