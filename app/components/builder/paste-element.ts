import type { CanvasElement } from "../site/types";
import type { BuilderState } from "./builder-types";
import { detach } from "./element-rules";
import { selectOnly } from "./selection";

const PASTE_OFFSET = 12;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Pega elementos copiados con su contenido. `ids` da un id nuevo para cada pieza, en el orden de `clip`.
 * El grupo se desplaza junto (sin salirse del lienzo); lo que no iba dentro de otra pieza queda suelto,
 * y lo que sí conserva su contenedor copiado. Queda seleccionado lo pegado.
 */
export function pasteElements(state: BuilderState, clip: CanvasElement[], ids: string[]): BuilderState {
  if (clip.length === 0) return state;

  const newIdOf = new Map(clip.map((element, index) => [element.id, ids[index]]));
  const roots = clip.filter((element) => element.parentId === undefined || !newIdOf.has(element.parentId));

  // Un solo desplazamiento para todo el grupo, limitado por lo que cabe en el lienzo.
  const right = Math.max(...roots.map((e) => e.x + e.width));
  const bottom = Math.max(...roots.map((e) => e.y + e.height));
  const dx = clamp(state.width - right, 0, PASTE_OFFSET);
  const dy = clamp(state.height - bottom, 0, PASTE_OFFSET);

  const copies = clip.map((element, index): CanvasElement => {
    const parentId = element.parentId === undefined ? undefined : newIdOf.get(element.parentId);
    const moved = { ...element, id: ids[index], x: element.x + dx, y: element.y + dy };
    return parentId === undefined ? detach(moved) : { ...moved, parentId };
  });

  const pastedRoots = roots.map((root) => newIdOf.get(root.id) as string);
  return selectOnly({ ...state, elements: [...state.elements, ...copies] }, pastedRoots);
}
