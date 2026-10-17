import { PROP_DEFS } from "./registry";
import { normalizeValue, scopeKey, variableNameOf, validateVariable } from "./resolve";
import type { StyleProp, StyleRule, StyleScope, StyleState, StyleTarget, Variable } from "./types";

/**
 * Cambia (o quita, con `null`) una propiedad de la regla de un tipo de elemento en un ámbito.
 * Devuelve el mismo arreglo si el valor no es válido. Una regla sin propiedades desaparece.
 */
export function setRuleProp(
  rules: StyleRule[],
  scope: StyleScope,
  target: StyleTarget,
  prop: StyleProp,
  value: string | null,
): StyleRule[] {
  let stored: string | null = null;
  if (value !== null) {
    // Una variable se guarda tal cual; un valor directo se valida y normaliza según su tipo.
    stored = variableNameOf(value) !== null ? value : normalizeValue(PROP_DEFS[prop].kind, value);
    if (stored === null) return rules;
  }

  const key = scopeKey(scope);
  const index = rules.findIndex((rule) => rule.target === target && scopeKey(rule.scope) === key);
  const current: StyleRule = index >= 0 ? rules[index] : { scope, target, props: {} };

  const props = { ...current.props };
  if (stored === null) delete props[prop];
  else props[prop] = stored;

  const others = rules.filter((_, i) => i !== index);
  return Object.keys(props).length > 0 ? [...others, { ...current, props }] : others;
}

export function clearRule(rules: StyleRule[], scope: StyleScope, target: StyleTarget): StyleRule[] {
  const key = scopeKey(scope);
  return rules.filter((rule) => !(rule.target === target && scopeKey(rule.scope) === key));
}

/** Crea o reemplaza una variable (mismo id). Si no es válida devuelve el arreglo sin cambios. */
export function saveVariable(variables: Variable[], variable: Variable): Variable[] {
  if (validateVariable(variables, variable) !== null) return variables;

  const normalized = { ...variable, value: normalizeValue(variable.kind, variable.value) ?? variable.value };
  return variables.some((v) => v.id === variable.id)
    ? variables.map((v) => (v.id === variable.id ? normalized : v))
    : [...variables, normalized];
}

/** Quita las reglas y variables de un ámbito que dejó de existir (una página o un componente borrados). */
export function withoutScope(styles: StyleState, scope: StyleScope): StyleState {
  const key = scopeKey(scope);
  return {
    variables: styles.variables.filter((v) => scopeKey(v.scope) !== key),
    rules: styles.rules.filter((r) => scopeKey(r.scope) !== key),
  };
}
