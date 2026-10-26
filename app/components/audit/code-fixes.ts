/** Arreglos puros sobre el código propio (HTML y JavaScript) de una página o bloque. */

const CONSOLE_LINE = /^[ \t]*(?:console\.\w+\([^\n]*\)|debugger);?[ \t]*\r?\n?/gm;
const DEBUG_USE = /\bconsole\.\w+\(|\bdebugger\b/g;
const ANCHOR = /<a\b([^>]*)>/gi;

/** Llamadas a console y `debugger` que quedan en el código. */
export const debugLeftovers = (js: string): number => js.match(DEBUG_USE)?.length ?? 0;

/** `document.write` bloquea la carga de la página. */
export const usesDocumentWrite = (js: string): boolean => /\bdocument\.write\s*\(/.test(js);

/** Quita las líneas que son solo un console.* o un debugger. */
export const stripDebug = (js: string): string => js.replace(CONSOLE_LINE, "");

/** ¿Queda algo que `stripDebug` no pueda quitar (por ejemplo, un console dentro de otra línea)? */
export const canStripAll = (js: string): boolean => debugLeftovers(stripDebug(js)) === 0;

const opensNewTab = (attrs: string) => /target\s*=\s*["']?_blank/i.test(attrs);
const isSafe = (attrs: string) => /rel\s*=\s*["'][^"']*noopener/i.test(attrs);

/** Enlaces que abren pestaña nueva sin `rel="noopener"`. */
export const unsafeNewTabLinks = (html: string): number =>
  [...html.matchAll(ANCHOR)].filter((m) => opensNewTab(m[1]) && !isSafe(m[1])).length;

/** Añade `rel="noopener noreferrer"` a los enlaces de pestaña nueva. */
export const addNoopener = (html: string): string =>
  html.replace(ANCHOR, (tag, attrs: string) =>
    opensNewTab(attrs) && !isSafe(attrs) ? `<a${attrs.replace(/\s+rel\s*=\s*(["'])[^"']*\1/i, "")} rel="noopener noreferrer">` : tag,
  );
