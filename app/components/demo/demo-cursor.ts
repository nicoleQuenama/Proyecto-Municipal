/** Dónde cae, en la pantalla, una zona de la página (píxeles de página) según el zoom y la posición del lienzo. */

export interface PageBox {
  left: number;
  top: number;
  /** Ancho de la página en pantalla y ancho de diseño: su razón es el zoom. */
  width: number;
  designWidth: number;
}

export interface Zone {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function pointInPage(page: PageBox, zone: Zone): { x: number; y: number } {
  const scale = page.width / page.designWidth;
  return { x: page.left + (zone.x + zone.width / 2) * scale, y: page.top + (zone.y + zone.height / 2) * scale };
}

/** Cuánto hay que desplazar el lienzo para dejar ese punto en el centro de la vista; 0 si ya se ve con holgura. */
export function scrollNeeded(pointY: number, view: { top: number; bottom: number }, margin = 80): number {
  if (pointY > view.top + margin && pointY < view.bottom - margin) return 0;
  return pointY - (view.top + view.bottom) / 2;
}
