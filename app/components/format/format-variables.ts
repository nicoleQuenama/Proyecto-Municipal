import type { Dispatch } from "react";
import { slugify } from "../site/rules";
import type { SiteAction } from "../site/types";
import { GLOBAL_SCOPE, validateVariable } from "../styles/resolve";
import type { Variable, VariableKind } from "../styles/types";

/** Crea una variable de todo el sitio. Devuelve el motivo si no se puede, o `null` si quedó creada. */
export type CreateVariable = (kind: VariableKind, name: string, value: string) => string | null;

export function makeCreateVariable(variables: Variable[], dispatch: Dispatch<SiteAction>): CreateVariable {
  return (kind, name, value) => {
    // "Color Acento" → "color-acento", igual que las rutas de las páginas.
    const variable: Variable = { id: crypto.randomUUID(), scope: GLOBAL_SCOPE, name: slugify(name), kind, value };

    const problem = validateVariable(variables, variable);
    if (problem) return problem;

    dispatch({ type: "variable/save", variable });
    return null;
  };
}
