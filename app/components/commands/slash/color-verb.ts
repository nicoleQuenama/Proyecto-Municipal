import { slugify } from "../../site/rules";
import { GLOBAL_SCOPE, validateVariable } from "../../styles/resolve";
import type { Variable } from "../../styles/types";
import { list, prompt } from "./steps";
import type { SlashContext, Step } from "./types";

const DEFAULT_COLOR = "#0d99ff";

/** /color: cambia el valor de una variable de color del sitio o crea una nueva. */
export function colorStep({ site, dispatch }: SlashContext): Step {
  // Devuelve el motivo si no se puede guardar; si no, la guarda.
  const save = (variable: Variable): string | void => {
    const problem = validateVariable(site.variables, variable);
    if (problem) return problem;
    dispatch({ type: "variable/save", variable });
  };

  const colors = site.variables.filter((variable) => variable.kind === "color");

  return list("Elige una variable de color o crea una", [
    {
      id: "new",
      label: "Nueva variable de color",
      hint: "Se usa en las reglas como var(--nombre)",
      run: () =>
        prompt("Nombre (p. ej. color-acento)", (name) => {
          const trimmed = slugify(name); // "Color Acento" → "color-acento"
          const draft: Variable = { id: crypto.randomUUID(), scope: GLOBAL_SCOPE, name: trimmed, kind: "color", value: DEFAULT_COLOR };

          // Se valida el nombre ya, para no pedir el valor de una variable que no se podrá guardar.
          const problem = validateVariable(site.variables, draft);
          if (problem) return problem;

          return prompt(`Color de --${trimmed} (#rrggbb)`, (value) => save({ ...draft, value }), DEFAULT_COLOR);
        }),
    },
    ...colors.map((variable) => ({
      id: variable.id,
      label: `--${variable.name}`,
      hint: variable.value,
      run: () =>
        prompt(`Nuevo color de --${variable.name} (#rrggbb)`, (value) => save({ ...variable, value }), variable.value),
    })),
  ]);
}
