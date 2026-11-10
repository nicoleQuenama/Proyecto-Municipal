import type { SiteState } from "../../components/site/types";
import { deepEqual } from "../site/deep-equal";

type Owned = { id: string; unitId?: string | null };

/** Las unidades (`null` = global) de lo que cambió entre dos listas con id: lo nuevo, lo editado y lo quitado, con la unidad que tenía. */
function changedIn(before: readonly Owned[], after: readonly Owned[]): (string | null)[] {
  const old = new Map(before.map((item) => [item.id, item]));
  const now = new Map(after.map((item) => [item.id, item]));
  const units: (string | null)[] = [];
  for (const [id, item] of now) {
    const prev = old.get(id);
    if (prev && deepEqual(prev, item)) continue;
    units.push(item.unitId ?? null);
    if (prev) units.push(prev.unitId ?? null);
  }
  for (const [id, item] of old) if (!now.has(id)) units.push(item.unitId ?? null);
  return units;
}

/** A qué unidades afecta lo que cambió entre el sitio del que partió una rama y el sitio de la rama (páginas y biblioteca de medios). */
export function changedUnitIds(base: SiteState | null, theirs: SiteState): (string | null)[] {
  const all = [...changedIn(base?.pages ?? [], theirs.pages), ...changedIn(base?.projectMedia ?? [], theirs.projectMedia ?? [])];
  return [...new Set(all)];
}
