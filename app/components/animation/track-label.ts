import { elementLabel } from "../navigation/links";
import { PLACE_KEY, SECTION_KEY, type ComponentDef, type Page } from "../site/types";

/** El nombre de una pieza de la animación: «Banner · Texto "Hola"», o «Banner · toda la sección». */
export function trackLabel(page: Page, components: ComponentDef[], blockId: string, key: string): string {
  const block = page.blocks.find((b) => b.id === blockId);
  const def = components.find((c) => c.id === block?.componentId);
  if (!def) return "Pieza que ya no existe";
  if (key === SECTION_KEY) return `${def.name} · toda la sección`;

  if (key === PLACE_KEY) return `${def.name} · posición en la página`;

  const element = def.elements.find((e) => e.id === key);
  return element ? `${def.name} · ${elementLabel(element)}` : `${def.name} · pieza que ya no existe`;
}
