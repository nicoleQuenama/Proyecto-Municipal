import type { SiteState } from "../../components/site/types.ts";
import { MAPPED_KEYS } from "./site-keys.ts";
import type { ListPatch, SitePatch } from "./site-patch.ts";

/** Aplica el orden que la persona vio; lo que no vio (algo que otra persona añadió) queda detrás, en su orden anterior. */
function ordered<T extends { id: string }>(items: T[], order: readonly string[] | undefined): T[] {
  if (!order) return items;
  const rank = new Map(order.map((id, index) => [id, index]));
  return items
    .map((item, index) => ({ item, key: rank.get(item.id) ?? order.length + index }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item);
}

/** La lista tal como queda después de ese parche. */
function applyList<T extends { id: string }>(items: readonly T[] | undefined, patch: ListPatch<T> | undefined): T[] {
  const current = items ?? [];
  if (!patch) return [...current];
  const removed = new Set(patch.remove);
  const kept = current.filter((item) => !removed.has(item.id));
  const known = new Set(kept.map((item) => item.id));
  const replaced = kept.map((item) => patch.upsert.find((next) => next.id === item.id) ?? item);
  const added = patch.upsert.filter((item) => !known.has(item.id));
  return ordered([...replaced, ...added], patch.order);
}

/** El sitio después de aplicarle un parche: lo mismo que hace el servidor con las tablas, pero sobre el sitio en memoria. */
export function applyPatchToSite(site: SiteState, patch: SitePatch): SiteState {
  // Las claves sueltas (las que no tienen tabla) las reemplaza el parche entero, como `projects.settings`.
  const kept = patch.settings ? Object.fromEntries(Object.entries(site).filter(([key]) => MAPPED_KEYS.includes(key))) : site;
  return {
    ...kept,
    ...(patch.settings ?? {}),
    ...(patch.navigation ? { navigation: patch.navigation } : {}),
    ...(patch.globalCss !== undefined ? { globalCss: patch.globalCss } : {}),
    pages: applyList(site.pages, patch.pages),
    components: applyList(site.components, patch.components),
    functions: applyList(site.functions, patch.functions),
    sources: applyList(site.sources, patch.sources),
    libraries: applyList(site.libraries, patch.libraries),
    ...(site.comments || patch.comments ? { comments: applyList(site.comments, patch.comments) } : {}),
    variables: patch.variables ?? site.variables,
    rules: patch.rules ?? site.rules,
  } as SiteState;
}
