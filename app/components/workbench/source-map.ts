/**
 * Traduce entre las líneas del código de un bloque y los elementos que ese código dibuja en la vista previa.
 * El HTML se lee con las posiciones de origen que da parse5; el CSS se recorre regla a regla para saber qué
 * selector contiene cada línea.
 */

import { parseFragment, type DefaultTreeAdapterTypes } from "parse5";

type ElementNode = DefaultTreeAdapterTypes.Element;
type ParentNode = DefaultTreeAdapterTypes.ParentNode;

export interface SourceNode {
  /** Posición del elemento dentro del cuerpo (`0,2,1`), la misma que usa el iframe. */
  path: string;
  tagName: string;
  startLine: number;
  endLine: number;
  startTagEndLine: number;
  outerHtml: string;
}

export interface SourceMap {
  nodes: SourceNode[];
  byPath: Map<string, SourceNode>;
}

const EMPTY: SourceMap = { nodes: [], byPath: new Map() };

const isElement = (node: ParentNode["childNodes"][number]): node is ElementNode => "tagName" in node;

/** El HTML de un bloque y las líneas donde empieza y termina cada elemento. */
export function buildSourceMap(html: string): SourceMap {
  if (!html.trim()) return EMPTY;

  let fragment: DefaultTreeAdapterTypes.DocumentFragment;
  try {
    fragment = parseFragment(html, { sourceCodeLocationInfo: true });
  } catch {
    return EMPTY;
  }

  const nodes: SourceNode[] = [];
  const byPath = new Map<string, SourceNode>();

  const walk = (parent: ParentNode, base: number[]) => {
    let index = 0;
    for (const child of parent.childNodes) {
      if (!isElement(child)) continue;
      const pathParts = [...base, index];
      index += 1;
      const path = pathParts.join(",");
      const location = child.sourceCodeLocation;
      if (location) {
        const node: SourceNode = {
          path,
          tagName: child.tagName,
          startLine: location.startLine,
          endLine: location.endLine,
          startTagEndLine: location.startTag?.endLine ?? location.startLine,
          outerHtml: html.slice(location.startOffset, location.endOffset),
        };
        nodes.push(node);
        byPath.set(path, node);
      }
      // El contenido de un <template> cuelga de `.content`.
      if (child.tagName === "template" && "content" in child) walk(child.content, pathParts);
      else walk(child, pathParts);
    }
  };

  walk(fragment, []);
  return { nodes, byPath };
}

const depthOf = (node: SourceNode) => node.path.split(",").length;

/** El elemento más interno que ocupa esa línea, o `null` si la línea es solo texto suelto. */
export function nodeAtLine(map: SourceMap, line: number): SourceNode | null {
  let found: SourceNode | null = null;
  for (const node of map.nodes) {
    if (line < node.startLine || line > node.endLine) continue;
    if (!found || depthOf(node) >= depthOf(found)) found = node;
  }
  return found;
}

const cleanCss = (css: string) =>
  css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));

const tidySelector = (selector: string) => selector.replace(/\s+/g, " ").trim();

/**
 * El selector de la regla que contiene esa línea del CSS. Sirve para resaltar en la vista previa lo que
 * se está editando. Se ignoran los `@media` y las reglas anidadas con `&`, que no se pueden consultar tal cual.
 */
export function selectorAtLine(css: string, line: number): string | null {
  const lines = cleanCss(css).split("\n");
  if (line < 1 || line > lines.length) return null;

  const stack: string[] = [];
  let buffer = "";

  for (let index = 0; index < lines.length; index += 1) {
    for (const char of lines[index]) {
      if (char === "{") {
        const selector = tidySelector(buffer);
        buffer = "";
        stack.push(selector.startsWith("@") ? "" : selector);
      } else if (char === "}") {
        buffer = "";
        stack.pop();
      } else {
        buffer += char;
      }
    }

    if (index + 1 !== line) continue;
    for (let at = stack.length - 1; at >= 0; at -= 1) {
      const selector = stack[at];
      if (selector && !selector.includes("&")) return selector;
    }
    return null;
  }

  return null;
}
