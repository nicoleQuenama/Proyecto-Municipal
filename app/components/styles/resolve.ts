/** Motor de resolución de estilos (puro): ámbitos, variables y cascada. */

import type {
  PropKind,
  ResolvedStyle,
  StyleContext,
  StyleProp,
  StyleScope,
  StyleState,
  StyleTarget,
  Variable,
} from "./types";

export const GLOBAL_SCOPE: StyleScope = { kind: "global" };

export function scopeKey(scope: StyleScope): string {
  switch (scope.kind) {
    case "global":
      return "global";
    case "page":
      return `page:${scope.pageId}`;
    case "component":
      return `component:${scope.componentId}`;
  }
}

export const sameScope = (a: StyleScope, b: StyleScope): boolean => scopeKey(a) === scopeKey(b);

/** Prioridad de un ámbito: global < página < componente. */
const LEVELS = { global: 0, page: 1, component: 2 } as const;
export const levelOf = (scope: StyleScope): number => LEVELS[scope.kind];

/** ¿Este ámbito cuenta para el elemento que se está resolviendo? */
function applies(scope: StyleScope, ctx: StyleContext): boolean {
  switch (scope.kind) {
    case "global":
      return true;
    case "page":
      return scope.pageId === ctx.pageId;
    case "component":
      return scope.componentId === ctx.componentId;
  }
}

// ---------- valores y variables ----------

const VARIABLE_REF = /^var\(--([a-z][a-z0-9-]*)\)$/;

export const asVariableRef = (name: string): string => `var(--${name})`;
export const variableNameOf = (value: string): string | null => VARIABLE_REF.exec(value)?.[1] ?? null;

const NUMBER = /^-?\d+(\.\d+)?$/;
const SIZE = /^-?\d+(\.\d+)?px$/;
const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const WEIGHTS = ["400", "500", "600", "700"];
const ALIGNMENTS = ["left", "center", "right"];

/** Devuelve el valor ya normalizado ("10" → "10px"), o null si no es válido para ese tipo. */
export function normalizeValue(kind: PropKind, input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  switch (kind) {
    case "size":
      if (NUMBER.test(value)) return `${value}px`;
      return SIZE.test(value) ? value : null;
    case "color":
      return HEX_COLOR.test(value) ? value.toLowerCase() : null;
    case "weight":
      return WEIGHTS.includes(value) ? value : null;
    case "align":
      return ALIGNMENTS.includes(value) ? value : null;
    case "font":
      return value;
  }
}

/** Las variables más cercanas ganan: componente > página > global. */
function findVariable(variables: Variable[], name: string, ctx: StyleContext): Variable | undefined {
  return variables
    .filter((variable) => variable.name === name && applies(variable.scope, ctx))
    .sort((a, b) => levelOf(b.scope) - levelOf(a.scope))[0];
}

const MAX_DEPTH = 5;

/** Sustituye `var(--x)` por su valor (una variable puede apuntar a otra). Sin definir → undefined. */
export function resolveValue(
  value: string,
  variables: Variable[],
  ctx: StyleContext,
  depth = 0,
): string | undefined {
  const name = variableNameOf(value);
  if (name === null) return value;
  if (depth >= MAX_DEPTH) return undefined;

  const variable = findVariable(variables, name, ctx);
  return variable ? resolveValue(variable.value, variables, ctx, depth + 1) : undefined;
}

/** Variables utilizables en un contexto, sin repetir nombres (gana la más cercana). */
export function availableVariables(variables: Variable[], ctx: StyleContext): Variable[] {
  const byName = new Map<string, Variable>();
  for (const variable of variables.filter((v) => applies(v.scope, ctx))) {
    const current = byName.get(variable.name);
    if (!current || levelOf(variable.scope) > levelOf(current.scope)) byName.set(variable.name, variable);
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

interface VariableCandidate {
  id: string;
  scope: StyleScope;
  name: string;
  kind: "color" | "size" | "font";
  value: string;
}

/** Motivo por el que una variable no se puede guardar, o null si es válida. */
export function validateVariable(variables: Variable[], candidate: VariableCandidate): string | null {
  if (!/^[a-z][a-z0-9-]*$/.test(candidate.name)) {
    return "Usa minúsculas, números y guiones, empezando por una letra (p. ej. color-primario).";
  }
  const key = scopeKey(candidate.scope);
  const duplicated = variables.some(
    (v) => v.id !== candidate.id && v.name === candidate.name && scopeKey(v.scope) === key,
  );
  if (duplicated) return "Ya existe una variable con ese nombre en este ámbito.";
  if (normalizeValue(candidate.kind, candidate.value) === null) return "El valor no es válido para ese tipo.";
  return null;
}

// ---------- cascada ----------

/**
 * Valores finales de un tipo de elemento: junta las reglas de los ámbitos que cuentan
 * (global, luego página, luego componente: el último gana) y resuelve las variables.
 * `maxLevel` permite preguntar qué se heredaría sin los ámbitos más específicos.
 */
export function computeStyle(
  styles: StyleState,
  ctx: StyleContext,
  target: StyleTarget,
  maxLevel = 2,
): ResolvedStyle {
  const rules = styles.rules
    .filter((rule) => rule.target === target && levelOf(rule.scope) <= maxLevel && applies(rule.scope, ctx))
    .sort((a, b) => levelOf(a.scope) - levelOf(b.scope));

  const merged: Partial<Record<StyleProp, string>> = {};
  for (const rule of rules) Object.assign(merged, rule.props);

  const resolved: ResolvedStyle = {};
  for (const [prop, raw] of Object.entries(merged) as [StyleProp, string][]) {
    const value = resolveValue(raw, styles.variables, ctx);
    if (value !== undefined) resolved[prop] = value;
  }
  return resolved;
}

/** Lo que heredaría una propiedad si el ámbito indicado no la definiera. */
export function inheritedValue(
  styles: StyleState,
  ctx: StyleContext,
  target: StyleTarget,
  prop: StyleProp,
  scope: StyleScope,
): string | undefined {
  return computeStyle(styles, ctx, target, levelOf(scope) - 1)[prop];
}
