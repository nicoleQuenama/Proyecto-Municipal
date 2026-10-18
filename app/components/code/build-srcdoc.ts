import { preludeOf } from "../functions/scope";
import { safeTranspile } from "./transpile";
import { importMapOf } from "../libraries/library-url";
import { rootVariablesCss, themeCss } from "../styles/css-variables";
import type { Variable } from "../styles/types";
import type { CodeSource, Library, SharedFunction } from "../site/types";

/** Lo del proyecto que el código de un bloque también puede usar. */
export interface SharedAssets {
  variables: Variable[];
  /** El CSS de todo el sitio. */
  globalCss: string;
  /** Las funciones reutilizables que valen para este bloque. */
  functions: SharedFunction[];
}

/** Avisa a la página de cuánto mide el contenido para que el iframe se ajuste. */
export const SIZE_MESSAGE = "portal:size";

const SIZE_REPORTER = `
  const report = () => parent.postMessage({ type: "${SIZE_MESSAGE}", height: document.documentElement.scrollHeight }, "*");
  new ResizeObserver(report).observe(document.documentElement);
  addEventListener("load", report);
  report();
`;

/** Evita que el contenido del usuario cierre antes de tiempo la etiqueta que lo contiene. */
const inside = (tag: "script" | "style", content: string) =>
  content.replace(new RegExp(`</${tag}`, "gi"), `<\/${tag}`);

/** El documento completo que se carga en el iframe: HTML, CSS, JS, Tailwind y las librerías del proyecto. */
export function buildSrcDoc(code: CodeSource, libraries: Library[], origin: string, shared: SharedAssets): string {
  const importMap = JSON.stringify(importMapOf(libraries, origin));
  // Con Tailwind las variables entran por `@theme` (dan clases como `bg-primario`); sin él, como variables CSS.
  const variables = code.tailwind ? themeCss(shared.variables) : rootVariablesCss(shared.variables);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${code.tailwind ? `<script src="${origin}/api/vendor/tailwind"></script>` : ""}
${libraries.length > 0 ? `<script type="importmap">${inside("script", importMap)}</script>` : ""}
<style${code.tailwind ? ' type="text/tailwindcss"' : ""}>
html, body { margin: 0; }
${variables}
${inside("style", shared.globalCss)}
${inside("style", code.css)}
</style>
</head>
<body>
${code.html}
<script type="module">
${inside("script", safeTranspile(`${preludeOf(shared.functions)}\n${code.js}`))}
</script>
<script>${SIZE_REPORTER}</script>
</body>
</html>`;
}
