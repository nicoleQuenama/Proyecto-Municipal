import type { SiteAction } from "./types";

/** Qué avisa cada acción destructiva al ejecutarse. `null` = esta vez no destruye nada. */
const LABELS: { [K in SiteAction["type"]]?: (action: Extract<SiteAction, { type: K }>) => string | null } = {
  "block/remove": () => "Sección eliminada",
  "component/delete": () => "Componente eliminado",
  "page/delete": () => "Página eliminada",
  "media/remove": () => "Medio eliminado",
  "hidden/purge": () => "Ocultos eliminados",
  "title/removed": (action) => (action.removed ? "Titular eliminado" : null),
  "element/remove": (action) => (action.elementIds.length > 1 ? `${action.elementIds.length} elementos eliminados` : "Elemento eliminado"),
};

/** El aviso «Eliminado · Deshacer» de una acción, o `null` si no es destructiva. */
export function undoLabel(action: SiteAction): string | null {
  const label = LABELS[action.type] as ((action: SiteAction) => string | null) | undefined;
  return label ? label(action) : null;
}

const SELECTION_ACTIONS = new Set<SiteAction["type"]>(["block/select", "element/select", "page/select"]);

/** Seleccionar no cuenta como trabajo nuevo: el aviso sigue ahí para poder deshacer. */
export const keepsUndo = (action: SiteAction): boolean => SELECTION_ACTIONS.has(action.type);
