/** ¿Terminó de cargar lo que se ve? Imágenes y tipografías de la página, y las peticiones de datos en camino. */

import { pendingCount } from "../data-sources/source-store";

/** Marca la vista del sitio probado, para mirar solo sus imágenes (no las de la pantalla de carga). */
export const SITE_VIEW_ATTRIBUTE = "data-site-view";

/** Lo más que se espera a la carga real: pasado esto, se muestra la página aunque algo siga pendiente. */
export const MAX_LOADING_SECONDS = 15;

export function isPageReady(): boolean {
  const view = document.querySelector(`[${SITE_VIEW_ATTRIBUTE}]`);
  const images = view ? [...view.querySelectorAll("img")] : [];
  return images.every((image) => image.complete) && document.fonts.status !== "loading" && pendingCount() === 0;
}

/**
 * Cuándo se quita la pantalla de carga: cuando pasó el mínimo que dura su animación y la página ya está lista,
 * o cuando se agota el máximo.
 */
export function shouldFinishLoading(elapsedMs: number, minSeconds: number, ready: boolean): boolean {
  return elapsedMs >= MAX_LOADING_SECONDS * 1000 || (elapsedMs >= minSeconds * 1000 && ready);
}
