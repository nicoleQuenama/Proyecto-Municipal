import type { CanvasElement, ComponentDef } from "../site/types";

/** Por debajo de este tamaño un texto deja de leerse. */
const MIN_FONT_SIZE = 11;

const scaled = (value: number, factor: number) => Math.round(value * factor);

function scaleElement(element: CanvasElement, factor: number): CanvasElement {
  return {
    ...element,
    x: scaled(element.x, factor),
    y: scaled(element.y, factor),
    width: Math.max(1, scaled(element.width, factor)),
    height: Math.max(1, scaled(element.height, factor)),
    radius: scaled(element.radius, factor),
    fontSize: Math.max(MIN_FONT_SIZE, scaled(element.fontSize, factor)),
  };
}

/**
 * El modo automático: si la sección es más ancha que el espacio disponible se reduce en proporción
 * (tamaño, posiciones y tipografía); si cabe, queda igual.
 */
export function autoLayout(def: ComponentDef, available: number): ComponentDef {
  if (def.width <= available) return def;

  const factor = available / def.width;
  return {
    ...def,
    width: scaled(def.width, factor),
    height: scaled(def.height, factor),
    elements: def.elements.map((element) => scaleElement(element, factor)),
  };
}
