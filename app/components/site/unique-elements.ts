import type { CanvasElement, ComponentDef, SiteState } from "./types";

/**
 * Definiciones guardadas antes de corregir el movimiento de tarjetas pueden traer ids repetidos. React exige claves
 * únicas entre hermanos, así que conservamos el primero de cada id para que esas defs antiguas sigan pintando sin
 * duplicados ni avisos en consola.
 */
export function uniqueElements(elements: CanvasElement[]): CanvasElement[] {
  const seen = new Set<string>();
  return elements.filter((element) => {
    if (seen.has(element.id)) return false;
    seen.add(element.id);
    return true;
  });
}

/** Sanitiza los componentes de un sitio al cargarlo, sin tocar los que ya están bien. */
export function uniqueSiteElements(site: SiteState): SiteState {
  let changed = false;
  const components: ComponentDef[] = site.components.map((def) => {
    const elements = uniqueElements(def.elements);
    if (elements.length === def.elements.length) return def;
    changed = true;
    return { ...def, elements };
  });
  return changed ? { ...site, components } : site;
}
