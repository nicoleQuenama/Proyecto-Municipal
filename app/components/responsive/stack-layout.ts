import type { CanvasElement, ComponentDef } from "../site/types";
import { autoLayout } from "./auto-layout";
import { FREE } from "./manual-layout";
import { layoutColumn } from "./stack-column";
import { buildTree } from "./stack-tree";
import type { Frame } from "./types";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Margen de arriba y de abajo de la sección apilada, según el que tenía. */
const EDGE = { min: 8, max: 40 };
/** Margen lateral cuando hay un fondo detrás del contenido. */
const SIDE = { min: 12, max: 24 };
/** Lo que más se puede encoger una letra grande, y el tamaño por debajo del cual no se toca. */
const MIN_FONT_FACTOR = 0.6;
const BIG_FONT = 24;

/** El fondo: la primera pieza (la de más atrás) que cubre casi toda la sección. */
function findBackdrop(def: ComponentDef, shown: CanvasElement[]): CanvasElement | undefined {
  const first = shown[0];
  const covers = first && first.width >= def.width * 0.9 && first.height >= def.height * 0.9;
  return covers && shown.length > 1 && ["rect", "image", "video"].includes(first.kind) ? first : undefined;
}

const smallerFont = (size: number, factor: number) => (size > BIG_FONT ? Math.max(BIG_FONT, Math.round(size * factor)) : size);

/**
 * Apila la sección en una sola columna del ancho disponible: conserva el fondo estirado, pone cada fila de
 * elementos uno bajo otro (de arriba abajo, de izquierda a derecha) y mantiene dentro de su panel lo que estaba encima.
 */
export function stackLayout(def: ComponentDef, available: number): ComponentDef {
  if (def.width <= available) return def;

  const shown = def.elements.filter((e) => !e.hidden);
  const backdrop = findBackdrop(def, shown);
  const content = shown.filter((e) => e !== backdrop);
  if (content.length === 0) return autoLayout(def, available);

  const side = backdrop ? clamp(Math.min(...content.map((e) => e.x)), SIDE.min, SIDE.max) : 0;
  const top = clamp(Math.min(...content.map((e) => e.y)), EDGE.min, EDGE.max);
  const bottom = clamp(def.height - Math.max(...content.map((e) => e.y + e.height)), EDGE.min, EDGE.max);

  const frames = new Map<string, Frame>();
  const used = layoutColumn(buildTree(content), side, top, available - 2 * side, frames);
  const height = top + used + bottom;
  if (backdrop) frames.set(backdrop.id, { x: 0, y: 0, width: available, height });

  const factor = Math.max(MIN_FONT_FACTOR, available / def.width);
  const elements = def.elements.map((e) => {
    const frame = frames.get(e.id);
    return frame ? { ...e, ...frame, ...FREE, fontSize: smallerFont(e.fontSize, factor) } : e;
  });
  return { ...def, width: available, height, elements };
}
