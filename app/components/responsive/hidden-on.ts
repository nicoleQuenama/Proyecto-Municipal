import type { CanvasElement } from "../site/types";
import type { Device } from "./devices";

/** ¿Está oculto en este dispositivo? */
export const isHiddenOn = (hiddenOn: Device[] | undefined, device: Device): boolean => hiddenOn?.includes(device) ?? false;

/** La lista tras ocultar o mostrar en un dispositivo; vacía se guarda como «sin lista». */
export function toggleHiddenOn(hiddenOn: Device[] | undefined, device: Device, hidden: boolean): Device[] | undefined {
  const rest = (hiddenOn ?? []).filter((d) => d !== device);
  const next = hidden ? [...rest, device] : rest;
  return next.length > 0 ? next : undefined;
}

/** Los elementos que sí se ven en el dispositivo; si no hay ninguno oculto devuelve la misma lista. */
export function visibleOn(elements: CanvasElement[], device: Device): CanvasElement[] {
  return elements.some((e) => isHiddenOn(e.hiddenOn, device)) ? elements.filter((e) => !isHiddenOn(e.hiddenOn, device)) : elements;
}
