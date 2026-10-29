import type { BlockInstance, CanvasElement, ComponentDef } from "../site/types";
import type { Device } from "./devices";
import { isAdaptive } from "./devices";
import { visibleOn } from "./hidden-on";
import type { MenuConfig } from "./types";

/** Lo que mide la zona que se toca para abrir el menú, además del dibujo (px). */
export const BUTTON_PADDING = 12;
/** Separación del botón al borde derecho de la sección (px). */
export const BUTTON_EDGE = 8;

/** Orden de lectura: de arriba abajo y de izquierda a derecha. */
export const readingOrder = (a: CanvasElement, b: CanvasElement): number => a.y - b.y || a.x - b.x;

/** Un elemento puede ir en un menú si tiene algo que mostrar: un texto o un ícono. */
const fitsInMenu = (element: CanvasElement): boolean => !element.hidden && (element.kind === "icon" || element.text.trim() !== "");

/** El menú de partida: los textos con enlace van dentro; el resto (marca, logo) se queda visible. */
export function defaultMenu(def: ComponentDef): MenuConfig {
  const linked = def.elements.filter(
    (element) => fitsInMenu(element) && (def.links?.[element.id] !== undefined || element.role === "link"),
  );
  return {
    itemIds: linked.sort(readingOrder).map((element) => element.id),
    panel: "right",
    icon: "menu",
    iconSize: 28,
  };
}

/** Separa la sección: lo que va dentro del menú (en orden de lectura) y lo que se queda en la cabecera. */
export function menuSplit(def: ComponentDef, config: MenuConfig): { rest: ComponentDef; items: CanvasElement[] } {
  const inMenu = new Set(config.itemIds);
  const items = def.elements.filter((element) => inMenu.has(element.id) && fitsInMenu(element)).sort(readingOrder);
  const shown = new Set(items.map((element) => element.id));
  return { items, rest: { ...def, elements: def.elements.filter((element) => !shown.has(element.id)) } };
}

export interface MenuSetup {
  config: MenuConfig;
  items: CanvasElement[];
}

/** El menú de una sección en un dispositivo; `null` si ahí no se adapta con «Menú». */
export function menuSetup(formatted: ComponentDef, block: BlockInstance, device: Device): MenuSetup | null {
  if (!isAdaptive(device) || block.responsive?.[device] || block.adapt?.[device] !== "menu") return null;
  const shown = { ...formatted, elements: visibleOn(formatted.elements, device) };
  const config = block.menu ?? defaultMenu(shown);
  return { config, items: menuSplit(shown, config).items };
}

/** Dónde queda el botón: a la derecha, centrado con el elemento más alto de la fila superior de la sección ya adaptada. */
export function menuButtonFrame(view: ComponentDef, config: MenuConfig): { top: number; right: number; size: number } {
  const size = config.iconSize + 2 * BUTTON_PADDING;
  const first = view.elements.filter((element) => !element.hidden).sort(readingOrder)[0];
  const center = first ? first.y + first.height / 2 : BUTTON_EDGE + size / 2;
  return { top: Math.max(0, Math.round(center - size / 2)), right: BUTTON_EDGE, size };
}

/** Marca o desmarca un elemento del menú. */
export function toggleItem(config: MenuConfig, elementId: string, inside: boolean): string[] {
  const rest = config.itemIds.filter((id) => id !== elementId);
  return inside ? [...rest, elementId] : rest;
}
