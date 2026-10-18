import { PROP_DEFS, TARGET_DEFS } from "../../styles/registry";
import { GLOBAL_SCOPE, normalizeValue, sameScope, variableNameOf } from "../../styles/resolve";
import type { PropKind, StyleProp, StyleScope, StyleTarget } from "../../styles/types";
import { list, prompt } from "./steps";
import { currentPageOf } from "./targets";
import type { SlashContext, Step } from "./types";

const VALUE_HINTS: Record<PropKind, string> = {
  size: "p. ej. 16px o var(--espacio)",
  color: "#rrggbb o var(--color-primario)",
  font: "el nombre de la tipografía",
  weight: "400, 500, 600 o 700",
  align: "left, center o right",
};

/** /regla: fija (o quita) una propiedad de estilo para un tipo de elemento, en todo el sitio o en la página. */
export function ruleStep({ site, dispatch }: SlashContext): Step {
  const page = currentPageOf(site);

  const valueStep = (scope: StyleScope, target: StyleTarget, prop: StyleProp): Step => {
    const { label, kind } = PROP_DEFS[prop];
    const current = site.rules.find((rule) => rule.target === target && sameScope(rule.scope, scope))?.props[prop];

    return prompt(
      `${TARGET_DEFS[target].label} · ${label}: ${VALUE_HINTS[kind]} (vacío = quitar)`,
      (text) => {
        const value = text.trim();
        if (value && variableNameOf(value) === null && normalizeValue(kind, value) === null) {
          return `«${value}» no es válido: usa ${VALUE_HINTS[kind]}.`;
        }
        dispatch({ type: "rule/set", scope, target, prop, value: value || null });
      },
      current,
    );
  };

  const propStep = (scope: StyleScope, target: StyleTarget): Step =>
    list(
      "¿Qué propiedad?",
      TARGET_DEFS[target].props.map((prop) => ({
        id: prop,
        label: PROP_DEFS[prop].label,
        run: () => valueStep(scope, target, prop),
      })),
    );

  const targetStep = (scope: StyleScope): Step =>
    list(
      "¿A qué tipo de elemento?",
      (Object.entries(TARGET_DEFS) as [StyleTarget, (typeof TARGET_DEFS)[StyleTarget]][]).map(([target, def]) => ({
        id: target,
        label: def.label,
        hint: def.hint,
        run: () => propStep(scope, target),
      })),
    );

  return list("¿Dónde vale la regla?", [
    { id: "global", label: "Todo el sitio", hint: "Todas las páginas", run: () => targetStep(GLOBAL_SCOPE) },
    {
      id: "page",
      label: `Solo ${page.name}`,
      hint: "Gana sobre las reglas de todo el sitio",
      run: () => targetStep({ kind: "page", pageId: page.id }),
    },
  ]);
}
