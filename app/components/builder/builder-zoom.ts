/** Reglas puras del zoom del constructor (1 = 100 %). */

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;
/** Margen entre el lienzo y el borde de la ventana. */
export const VIEW_PADDING = 32;

/** Los niveles a los que saltan los botones − y +. */
export const ZOOM_STOPS = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];

export const clampZoom = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

/** El mayor zoom (sin pasar de 100 %) con el que el lienzo cabe entero en la ventana. */
export function fitScale(view: { width: number; height: number }, canvas: { width: number; height: number }): number {
  const room = (side: number) => Math.max(1, side - 2 * VIEW_PADDING);
  return clampZoom(Math.min(1, room(view.width) / canvas.width, room(view.height) / canvas.height));
}

/** El siguiente (1) o anterior (-1) nivel del zoom. */
export function stepZoom(zoom: number, direction: 1 | -1): number {
  const EPS = 1e-6;
  const next =
    direction === 1
      ? ZOOM_STOPS.find((stop) => stop > zoom + EPS)
      : [...ZOOM_STOPS].reverse().find((stop) => stop < zoom - EPS);
  return next ?? clampZoom(zoom);
}

/** El zoom tras girar la rueda con Ctrl: cada muesca multiplica por una constante. */
export const wheelZoom = (zoom: number, deltaY: number) => clampZoom(zoom * Math.exp(-deltaY * 0.0015));

/**
 * Cuánto desplazar el scroll para que el punto del lienzo bajo el cursor siga bajo el cursor al cambiar de zoom.
 * `cursor` es la posición dentro de la ventana; `scroll` el desplazamiento actual; `pad` el margen fijo que
 * hay antes del lienzo (no se escala).
 */
export function scrollAfterZoom(scroll: number, cursor: number, from: number, to: number, pad = 0): number {
  return ((scroll + cursor - pad) / from) * to + pad - cursor;
}

export const zoomLabel = (zoom: number) => `${Math.round(zoom * 100)} %`;
