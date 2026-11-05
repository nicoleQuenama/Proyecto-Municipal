import { preludeOf } from "../functions/scope";
import { safeTranspile } from "./transpile";
import { importMapOf } from "../libraries/library-url";
import { rootVariablesCss, themeCss } from "../styles/css-variables";
import type { Variable } from "../styles/types";
import type { CodeSource, Library, SharedFunction } from "../site/types";
import { CLEAR_MESSAGE, ELEMENT_MESSAGE, HIGHLIGHT_MESSAGE, LOG_MESSAGE, SIZE_MESSAGE } from "./messages";

export { SIZE_MESSAGE };

/** Lo del proyecto que el código de un bloque también puede usar. */
export interface SharedAssets {
  variables: Variable[];
  /** El CSS de todo el sitio. */
  globalCss: string;
  /** Las funciones reutilizables que valen para este bloque. */
  functions: SharedFunction[];
}

/** Avisa a la página de cuánto mide el contenido para que el iframe se ajuste. */
const SIZE_REPORTER = `
  const report = () => parent.postMessage({ type: "${SIZE_MESSAGE}", height: document.documentElement.scrollHeight }, "*");
  new ResizeObserver(report).observe(document.documentElement);
  addEventListener("load", report);
  report();
`;

/** Todo lo que el codigo escribe en la consola (y sus errores) vuelve al editor. */
const CONSOLE_BRIDGE = `
(() => {
  const send = (level, args) => {
    try {
      const parts = Array.from(args, (value) => {
        if (typeof value === "string") return value;
        if (value instanceof Error) return value.stack || value.message;
        if (typeof value === "function") return "[Function " + (value.name || "anonima") + "]";
        if (value === null) return "null";
        if (value === undefined) return "undefined";
        if (typeof value === "object") {
          if (value instanceof Element) return "<" + value.tagName.toLowerCase() + ">";
          try { return JSON.stringify(value); } catch { return String(value); }
        }
        return String(value);
      });
      parent.postMessage({ type: "${LOG_MESSAGE}", level, text: parts.join(" "), at: Date.now() }, "*");
    } catch {}
  };
  for (const level of ["log", "info", "warn", "error", "debug"]) {
    const original = console[level].bind(console);
    console[level] = (...args) => { send(level, args); original(...args); };
  }
  addEventListener("error", (event) => {
    const message = event.message || (event.error && event.error.message) || "Error";
    const where = event.filename ? " (" + event.filename + ":" + event.lineno + ":" + event.colno + ")" : "";
    send("error", [message + where]);
  });
  addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    send("error", ["Promesa rechazada: " + (reason && reason.stack ? reason.stack : String(reason))]);
  });
})();
`;

/**
 * Deja senalar elementos en la vista previa y resaltarlos desde el editor. Cada elemento se identifica por su
 * posicion (`0,2,1`), que el editor traduce a las lineas del HTML que lo dibujan.
 */
const INSPECTOR_BRIDGE = `
(() => {
  const pathOf = (element) => {
    const parts = [];
    let node = element;
    while (node && node !== document.body) {
      const parent = node.parentElement;
      if (!parent) break;
      parts.unshift(Array.prototype.indexOf.call(parent.children, node));
      node = parent;
    }
    return parts.join(",");
  };
  const find = (path) => {
    let element = document.body;
    if (!path) return null;
    for (const part of path.split(",")) {
      if (!part) continue;
      element = element.children[Number(part)];
      if (!element) return null;
    }
    return element;
  };
  const saved = new Map();
  let marked = [];
  const paint = (element, kind) => {
    if (!element) return;
    if (!saved.has(element)) saved.set(element, { outline: element.style.outline, offset: element.style.outlineOffset });
    if (!kind) {
      const base = saved.get(element);
      element.style.outline = base.outline;
      element.style.outlineOffset = base.offset;
      return;
    }
    element.style.setProperty("outline", kind === "select" ? "2px solid #6366f1" : "2px dashed #6366f1", "important");
    element.style.setProperty("outline-offset", "2px", "important");
  };
  const unpaint = () => {
    for (const element of marked) paint(element, null);
    marked = [];
  };
  let hovered = null;
  const notify = (action, element) => {
    parent.postMessage({
      type: "${ELEMENT_MESSAGE}",
      action,
      path: element ? pathOf(element) : "",
      tag: element ? element.tagName.toLowerCase() : undefined,
      html: element ? element.outerHTML.slice(0, 4000) : undefined,
    }, "*");
  };
  document.addEventListener("pointermove", (event) => {
    const element = event.target instanceof Element && event.target !== document.body ? event.target : null;
    if (element === hovered) return;
    hovered = element;
    if (element) notify("hover", element);
    else notify("leave", null);
  }, true);
  document.addEventListener("pointerleave", () => {
    hovered = null;
    notify("leave", null);
  }, true);
  document.addEventListener("click", (event) => {
    const element = event.target instanceof Element && event.target !== document.body ? event.target : null;
    if (!element) return;
    paint(element, "select");
    notify("select", element);
  }, true);
  addEventListener("message", (event) => {
    const data = event.data;
    if (!data || typeof data !== "object") return;
    if (data.type === "${CLEAR_MESSAGE}") { unpaint(); return; }
    if (data.type !== "${HIGHLIGHT_MESSAGE}") return;
    unpaint();
    const kind = data.kind === "select" ? "select" : "hover";
    if (data.selector) {
      let matches = [];
      try { matches = Array.from(document.querySelectorAll(data.selector)); } catch {}
      for (const element of matches) paint(element, kind);
      marked = matches;
      return;
    }
    if (data.path) {
      const element = find(data.path);
      if (element) { paint(element, kind); marked = [element]; }
    }
  });
})();
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
<script>${inside("script", CONSOLE_BRIDGE)}</script>
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
<script>${inside("script", INSPECTOR_BRIDGE)}</script>
<script type="module">
${inside("script", safeTranspile(`${preludeOf(shared.functions)}\n${code.js}`))}
</script>
<script>${SIZE_REPORTER}</script>
</body>
</html>`;
}
