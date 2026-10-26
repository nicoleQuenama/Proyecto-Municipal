"use client";

import { useState } from "react";
import { Badge } from "../ui/badge";
import { Collapsible } from "../ui/collapsible";
import { useCurrentPage, useSite, useSiteDispatch } from "../site/site-context";
import { GROUP_LABELS, TARGET_DEFS, type TargetGroup } from "../styles/registry";
import { GLOBAL_SCOPE, sameScope } from "../styles/resolve";
import type { StyleContext, StyleRule, StyleScope, StyleTarget } from "../styles/types";
import { ScopePicker, type ScopeChoice } from "./scope-picker";
import { TargetCard } from "./target-card";
import { VariablesSection } from "./variables-section";
import { styleTarget } from "../site/categories";

const GROUP_ORDER: TargetGroup[] = ["page", "block", "element"];
const ELEMENT_TARGETS = (Object.keys(TARGET_DEFS) as StyleTarget[]).filter(
  (target) => TARGET_DEFS[target].group === "element",
);
const ALL_TARGETS = Object.keys(TARGET_DEFS) as StyleTarget[];

const SCOPE_HELP = {
  global: "Valen para todas las páginas. Una página o un componente pueden sobrescribirlas.",
  page: "Solo valen en esta página y ganan a las del sitio. Sus variables sobrescriben las globales.",
  component: "Solo valen en este componente y ganan a las de la página y del sitio.",
} as const;

/** Cuántas propiedades hay definidas en este ámbito para un grupo de tipos de elemento. */
function RuleCount({
  rules,
  scope,
  targets,
}: {
  rules: StyleRule[];
  scope: StyleScope;
  targets: StyleTarget[];
}) {
  const count = rules
    .filter((rule) => targets.includes(rule.target) && sameScope(rule.scope, scope))
    .reduce((total, rule) => total + Object.keys(rule.props).length, 0);

  return count > 0 ? <Badge tone="accent">{count}</Badge> : null;
}

export function AppearanceTab() {
  const site = useSite();
  const dispatch = useSiteDispatch();
  const page = useCurrentPage();
  const [choice, setChoice] = useState<ScopeChoice>({ kind: "global" });

  // Si el componente elegido se eliminó, se vuelve al ámbito global.
  const component =
    choice.kind === "component" ? site.components.find((c) => c.id === choice.componentId) : undefined;
  const activeKind = choice.kind === "component" && !component ? "global" : choice.kind;

  const scope: StyleScope =
    activeKind === "page"
      ? { kind: "page", pageId: page.id }
      : component
        ? { kind: "component", componentId: component.id }
        : GLOBAL_SCOPE;
  const ctx: StyleContext = { pageId: page.id, componentId: component?.id };

  // Un componente solo tiene su propia caja (su categoría) y los roles de sus elementos.
  const targets = component ? [styleTarget(component.category), ...ELEMENT_TARGETS] : ALL_TARGETS;
  const groups = GROUP_ORDER.map((group) => ({
    group,
    targets: targets.filter((target) => TARGET_DEFS[target].group === group),
  })).filter((entry) => entry.targets.length > 0);

  return (
    <div className="flex flex-col gap-5">
      <ScopePicker
        choice={choice}
        pageName={page.name}
        components={site.components}
        onChange={setChoice}
      />
      <p className="-mt-3 text-xs text-ink-dim">{SCOPE_HELP[activeKind]}</p>

      <VariablesSection scope={scope} ctx={ctx} variables={site.variables} dispatch={dispatch} />

      {groups.map(({ group, targets: groupTargets }) => (
        <Collapsible
          key={`${activeKind}-${component?.id ?? ""}-${group}`}
          title={`Reglas · ${GROUP_LABELS[group]}`}
          // Las cajas de componente son las menos usadas: empiezan cerradas para no hacer scroll de más.
          defaultOpen={group !== "block"}
          badge={<RuleCount rules={site.rules} scope={scope} targets={groupTargets} />}
        >
          <ul className="flex flex-col gap-1.5">
            {groupTargets.map((target) => (
              <TargetCard
                // key con el ámbito: al cambiarlo, las tarjetas se cierran y se reinician.
                key={`${activeKind}-${component?.id ?? ""}-${target}`}
                target={target}
                label={component && target === styleTarget(component.category) ? "Caja de este componente" : undefined}
                rule={site.rules.find((rule) => rule.target === target && sameScope(rule.scope, scope))}
                scope={scope}
                ctx={ctx}
                styles={site}
                onSet={(prop, value) => dispatch({ type: "rule/set", scope, target, prop, value })}
                onClear={() => dispatch({ type: "rule/clear", scope, target })}
              />
            ))}
          </ul>
        </Collapsible>
      ))}
    </div>
  );
}
