"use client";

import { hostVariablesCss, themeCss } from "../styles/css-variables";
import { componentCss, cssProblem } from "./custom-code";
import { useSite } from "./site-context";

/** El CSS de usuario, acotado con `@scope` a su raíz para que no pueda tocar la interfaz del editor. */
const scoped = (root: string, css: string): string =>
  css.trim() && cssProblem(css) === null ? `@scope (${root}) {\n${css}\n}` : "";

/**
 * Los estilos del proyecto para las páginas del sitio: las variables (como variables CSS y como utilidades
 * de Tailwind), el CSS global y el CSS de cada página. Nada de esto sale de las páginas.
 */
export function SiteStyles() {
  const { variables, globalCss, pages, components } = useSite();

  const css = [
    hostVariablesCss(variables),
    scoped("[data-site-page]", globalCss),
    // Los estilos de un componente valen en todas sus instancias, en cualquier página.
    ...components.map(componentCss),
    ...pages.map((page) => scoped(`[data-page-id="${page.id}"] [data-site-page]`, page.css ?? "")),
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <>
      <style>{css}</style>
      {/* Lo lee el Tailwind del navegador (ver tailwind-runtime): `--color-primario` da `bg-primario`, `text-primario`… */}
      <style type="text/tailwindcss">{themeCss(variables)}</style>
    </>
  );
}
