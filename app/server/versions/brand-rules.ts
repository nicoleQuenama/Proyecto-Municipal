import type { Tx } from "../db";
import type { SiteState } from "../../components/site/types";
import { asVariableRef, variableNameOf } from "../../components/styles/resolve";
import type { StyleProp, StyleRule, Variable } from "../../components/styles/types";
import { deepEqual } from "../site/deep-equal";
import type { SitePatch } from "../site/site-patch";
import { VersionError } from "./branch-rows";

/**
 * El manual de marca de la organización: lo GLOBAL (paleta, tipografías y reglas de estilo del sitio) lo define solo el
 * superadministrador. Los demás pueden usarlo y AMPLIARLO (variables y reglas de una página o un componente), pero no
 * cambiarlo ni borrarlo. Si el superadministrador marca «uso obligatorio», lo que añadan debe usar variables, no valores sueltos.
 */

/** Propiedades de color y tipografía: las que el manual de marca puede obligar a tomar de una variable. */
const BRAND_PROPS: StyleProp[] = ["color", "background", "fill", "fontFamily"];

const byId = (a: Variable, b: Variable) => a.id.localeCompare(b.id);
const isGlobal = (item: { scope: { kind: string } }) => item.scope.kind === "global";
const ruleKey = (rule: StyleRule) => rule.target;

/** Lo global de un parche frente a lo que ya hay: ¿cambió algo del manual de marca? */
export function changesBrand(patch: SitePatch, current: SiteState): boolean {
  if (patch.variables && !deepEqual(patch.variables.filter(isGlobal).sort(byId), current.variables.filter(isGlobal).sort(byId))) return true;
  if (patch.rules) {
    const sorted = (rules: StyleRule[]) => rules.filter(isGlobal).sort((a, b) => ruleKey(a).localeCompare(ruleKey(b)));
    if (!deepEqual(sorted(patch.rules), sorted(current.rules))) return true;
  }
  return patch.settings !== undefined && !!patch.settings.brandRequired !== !!current.brandRequired;
}

/** Reglas nuevas o cambiadas (fuera de lo global) que ponen un color o una tipografía suelta en vez de una variable. */
export function looseBrandValues(patch: SitePatch, current: SiteState): string[] {
  if (!patch.rules) return [];
  const before = new Map(current.rules.map((rule) => [JSON.stringify([rule.scope, rule.target]), rule]));
  const loose: string[] = [];
  for (const rule of patch.rules.filter((item) => !isGlobal(item))) {
    const previous = before.get(JSON.stringify([rule.scope, rule.target]));
    for (const prop of BRAND_PROPS) {
      const value = rule.props[prop];
      if (value !== undefined && value !== previous?.props[prop] && variableNameOf(value) === null) loose.push(`${rule.target}.${prop}`);
    }
  }
  return loose;
}

/** Rechaza (403) lo que toca el manual de marca sin ser superadministrador, o lo que lo ignora cuando es obligatorio. */
export async function assertBrandRespected(tx: Tx, patch: SitePatch, current: SiteState): Promise<void> {
  const [row] = await tx.unsafe(`select app.is_org_superadmin() as ok`);
  if (row?.ok === true) return;
  if (changesBrand(patch, current)) throw new VersionError("El manual de marca (paleta, tipografías y estilos globales) solo lo cambia el superadministrador.", 403);
  if (current.brandRequired) {
    const loose = looseBrandValues(patch, current);
    if (loose.length > 0) throw new VersionError(`La marca es obligatoria: usa una variable (${asVariableRef("nombre")}) en lugar de valores sueltos (${loose.join(", ")}).`, 403);
  }
}
