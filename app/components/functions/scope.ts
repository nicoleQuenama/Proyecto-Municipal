/** Reglas puras de las funciones reutilizables: dónde valen y cómo se juntan en el código que las usa. */

import type { FunctionScope, SharedFunction } from "../site/types";

/** Desde dónde se llama: un bloque y, si es el caso, uno de sus elementos. */
export interface CallSite {
  blockId?: string;
  elementId?: string;
}

/** Cuánto se acerca cada alcance a quien lo usa: si dos funciones se llaman igual, gana la más cercana. */
const SPECIFICITY: { [K in FunctionScope["kind"]]: number } = { global: 0, block: 1, element: 2 };

/** ¿Vale este alcance para el código que se llama desde `site`? */
const APPLIES: {
  [K in FunctionScope["kind"]]: (scope: Extract<FunctionScope, { kind: K }>, site: CallSite) => boolean;
} = {
  global: () => true,
  block: (scope, site) => scope.blockId === site.blockId,
  element: (scope, site) => scope.blockId === site.blockId && scope.elementId === site.elementId,
};

const applies = (scope: FunctionScope, site: CallSite): boolean =>
  (APPLIES[scope.kind] as (scope: FunctionScope, site: CallSite) => boolean)(scope, site);

/** Las funciones que puede llamar el código de `site`, sin repetir nombres (gana la de alcance más cercano). */
export function functionsFor(functions: SharedFunction[], site: CallSite): SharedFunction[] {
  const byName = new Map<string, SharedFunction>();

  for (const fn of functions.filter((f) => applies(f.scope, site))) {
    const current = byName.get(fn.name);
    if (!current || SPECIFICITY[fn.scope.kind] >= SPECIFICITY[current.scope.kind]) byName.set(fn.name, fn);
  }
  return [...byName.values()];
}

/** Las declaraciones de varias funciones, listas para ponerlas delante del código que las usa. */
export const preludeOf = (functions: SharedFunction[]): string => functions.map((fn) => fn.code).join("\n\n");

export const FUNCTION_NAME = /^[A-Za-z_$][\w$]*$/;

/** El nombre declarado en un código `function nombre(…)`, si lo hay. */
export function declaredName(code: string): string | null {
  return /^\s*(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/.exec(code)?.[1] ?? null;
}

/**
 * Convierte código seleccionado en una función con nombre. Si la selección ya es una declaración
 * completa se respeta y no deja nada en su lugar (la función ya se puede llamar); si no, se envuelve y
 * en su lugar queda la llamada. `call` es lo que se escribe donde estaba lo seleccionado.
 */
export function extractFunction(selection: string, name: string): { code: string; call: string } {
  const code = selection.trim();
  if (declaredName(code) === name) return { code, call: "" };

  const body = code
    .split("\n")
    .map((line) => (line.trim() ? `  ${line}` : line))
    .join("\n");
  return { code: `function ${name}() {\n${body}\n}`, call: `${name}();` };
}
