import type { ComponentDef } from "../site/types";
import { autoLayout } from "./auto-layout";
import { isAdaptive, type Device } from "./devices";

export interface DesktopFitInput {
  flow: boolean;
  /** Cabecera, pie o cualquier sección cuyo ancho manda la página. */
  locked: boolean;
  /** Colocada con posición libre: no se escala, se mueve. */
  placed: boolean;
}

/**
 * En escritorio el margen lateral reduce el ancho útil de la hoja. Una sección normal se escala a ese ancho para que
 * el margen se vea también en los componentes; la definición guardada no se toca. Grid/flex, cabeceras, pies y
 * secciones colocadas conservan su ancho: el margen ya lo aplica la hoja o su posición es manual.
 */
export function fitDesktopWidth(view: ComponentDef, device: Device, width: number, input: DesktopFitInput): ComponentDef {
  if (isAdaptive(device) || input.flow || input.locked || input.placed) return view;
  return autoLayout(view, width);
}
