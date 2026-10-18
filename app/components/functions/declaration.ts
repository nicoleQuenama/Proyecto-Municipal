import type { SharedFunction } from "../site/types";

/** El índice del paréntesis que cierra el que abre en `open`, o -1. */
function matchingParen(code: string, open: number): number {
  let depth = 0;
  for (let i = open; i < code.length; i += 1) {
    if (code[i] === "(") depth += 1;
    if (code[i] === ")" && --depth === 0) return i;
  }
  return -1;
}

/**
 * La declaración «ambiental» de una función para el editor (`declare function nombre(a: string): void;`),
 * leída de su cabecera. Así los demás archivos ven su nombre, sus parámetros y su tipo de retorno.
 */
export function declarationOf(fn: SharedFunction): string {
  const fallback = `declare function ${fn.name}(...args: any[]): any;`;
  const header = /^\s*(async\s+)?function\s*\*?\s*[A-Za-z_$][\w$]*\s*(<[^(]*>)?\s*\(/.exec(fn.code);
  if (!header) return fallback;

  const open = header[0].length - 1;
  const close = matchingParen(fn.code, open);
  if (close < 0) return fallback;

  const generics = header[2] ?? "";
  const params = fn.code.slice(open, close + 1);
  // Lo que hay entre «)» y la llave del cuerpo es el tipo de retorno, si lo escribió.
  const annotated = /^\s*:\s*([^{]+?)\s*\{/.exec(fn.code.slice(close + 1))?.[1];
  const returns = annotated ?? (header[1] ? "Promise<any>" : "any");

  return `declare function ${fn.name}${generics}${params}: ${returns};`;
}
