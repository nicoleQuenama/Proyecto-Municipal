import type { CanvasElement, ComponentDef } from "../site/types";
import type { DeviceLayout, Frame } from "./types";

/** Un elemento con marco propio deja de seguir a su contenedor: su posición ya es la que se definió. */
const FREE = { parentId: undefined, slot: undefined, offset: undefined, fitToParent: undefined } as const;

/** La sección tal como la definió la persona para un dispositivo. */
export function applyLayout(def: ComponentDef, layout: DeviceLayout): ComponentDef {
  const place = (element: CanvasElement): CanvasElement => {
    const frame = layout.frames[element.id];
    return frame ? { ...element, ...frame, ...FREE } : element;
  };
  return { ...def, ...layout.size, elements: def.elements.map(place) };
}

/** El punto de partida al pasar a manual: lo que se ve ahora (el resultado automático). */
export function seedLayout(view: ComponentDef): DeviceLayout {
  const frames: Record<string, Frame> = {};
  for (const { id, x, y, width, height } of view.elements) frames[id] = { x, y, width, height };
  return { size: { width: view.width, height: view.height }, frames };
}

export function patchFrame(layout: DeviceLayout, elementId: string, patch: Partial<Frame>): DeviceLayout {
  const current = layout.frames[elementId];
  return current ? { ...layout, frames: { ...layout.frames, [elementId]: { ...current, ...patch } } } : layout;
}

export function patchSize(layout: DeviceLayout, size: Partial<DeviceLayout["size"]>, backdropId?: string): DeviceLayout {
  const next = { ...layout.size, ...size };
  const resized = { ...layout, size: next };
  // El fondo de una tarjeta crece con ella.
  return backdropId ? patchFrame(resized, backdropId, { x: 0, y: 0, ...next }) : resized;
}
