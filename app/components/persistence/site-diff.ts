import type { ListPatch, SitePatch } from "../../server/site/site-patch";
import { MAPPED_KEYS } from "../../server/site/site-keys";
import type { SiteState } from "../site/types";

const same = (a: unknown, b: unknown): boolean => a === b || JSON.stringify(a) === JSON.stringify(b);

/**
 * Qué cambió en una lista de cosas con id. El editor nunca modifica un objeto: crea uno nuevo, así que comparar por
 * referencia casi siempre basta; el JSON solo confirma los que se reconstruyeron igual (p. ej. tras cargar).
 */
function listPatch<T extends { id: string }>(before: readonly T[], after: readonly T[]): ListPatch<T> | undefined {
  const previous = new Map(before.map((item) => [item.id, item]));
  const present = new Set(after.map((item) => item.id));
  const upsert = after.filter((item) => !same(previous.get(item.id), item));
  const remove = before.filter((item) => !present.has(item.id)).map((item) => item.id);
  const reordered = before.length !== after.length || before.some((item, index) => item.id !== after[index].id);
  if (upsert.length === 0 && remove.length === 0 && !reordered) return undefined;
  return { upsert, remove, ...(reordered ? { order: after.map((item) => item.id) } : {}) };
}

/** Las claves del sitio que no tienen tabla propia (p. ej. la biblioteca de medios). */
const looseKeys = (state: SiteState): Record<string, unknown> => Object.fromEntries(Object.entries(state).filter(([key]) => !MAPPED_KEYS.includes(key)));

/**
 * Lo que hay que enviar para que el servidor quede como `after`, sabiendo que ya tiene `before`
 * (`null` = el servidor está vacío). `null` si no cambió nada que guardar.
 */
export function diffSite(before: SiteState | null, after: SiteState): SitePatch | null {
  const patch: SitePatch = {
    ...(before && same(before.navigation, after.navigation) ? {} : { navigation: after.navigation }),
    ...(before && same(looseKeys(before), looseKeys(after)) ? {} : { settings: looseKeys(after) }),
    ...(before && before.globalCss === after.globalCss ? {} : { globalCss: after.globalCss }),
    pages: listPatch(before?.pages ?? [], after.pages),
    components: listPatch(before?.components ?? [], after.components),
    functions: listPatch(before?.functions ?? [], after.functions),
    sources: listPatch(before?.sources ?? [], after.sources),
    libraries: listPatch(before?.libraries ?? [], after.libraries),
    comments: listPatch(before?.comments ?? [], after.comments ?? []),
    ...(same(before?.variables ?? [], after.variables) ? {} : { variables: after.variables }),
    ...(same(before?.rules ?? [], after.rules) ? {} : { rules: after.rules }),
  };

  // Una clave sin cambios llega `undefined`: se quita para que el parche vacío sea realmente vacío.
  const kept = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
  // Un servidor vacío no necesita «globalCss: ''» ni «settings: {}»: no hay nada que guardar con eso.
  if (before === null) {
    if (kept.globalCss === "") delete kept.globalCss;
    if (kept.settings && Object.keys(kept.settings as object).length === 0) delete kept.settings;
  }
  return Object.keys(kept).length > 0 ? (kept as SitePatch) : null;
}
