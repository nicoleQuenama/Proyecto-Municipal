import { deepEqual } from "../site/deep-equal";
import { VersionError } from "../versions/branch-rows";

export interface SliceRules<T> {
  /** Lo que identifica a un elemento dentro de la lista. */
  key: (item: T) => string;
  /** ¿Lo ve la persona? Lo que no ve nunca viaja en lo que envía. */
  visible: (item: T) => boolean;
  /** ¿Puede cambiarlo, crearlo o quitarlo? (Lo global se ve, pero no se edita sin permiso.) */
  editable: (item: T) => boolean;
}

const forbidden = (): never => {
  throw new VersionError("No tienes permiso para cambiar eso: es de otra unidad o es global.", 403);
};

/**
 * Las listas que se guardan ENTERAS (estilos, medios del proyecto) llegan filtradas: la persona solo mandó lo que ve. Esto las
 * reconstruye completas: conserva lo que no ve, aplica lo que sí puede cambiar y rechaza (403) tocar lo ajeno o de solo lectura.
 */
export function mergeVisibleSlice<T>(full: readonly T[], submitted: readonly T[], rules: SliceRules<T>): T[] {
  const current = new Map(full.map((item) => [rules.key(item), item]));
  const sent = new Map(submitted.map((item) => [rules.key(item), item]));

  for (const [key, item] of sent) {
    const before = current.get(key);
    if (before && deepEqual(before, item)) continue;
    if (!rules.visible(item) || !rules.editable(item) || (before && !rules.editable(before))) forbidden();
  }
  for (const [key, item] of current) if (!sent.has(key) && rules.visible(item) && !rules.editable(item)) forbidden();

  const kept = full.flatMap((item) => {
    const key = rules.key(item);
    return sent.has(key) ? [sent.get(key)!] : rules.visible(item) ? [] : [item];
  });
  return [...kept, ...submitted.filter((item) => !current.has(rules.key(item)))];
}
