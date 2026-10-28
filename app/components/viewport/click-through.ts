import type { MouseEvent } from "react";

/** Lo que ya responde por sí mismo a un clic: no se le quita. */
const RESPONDS = "[data-interactive], a, button, input, textarea, select, label, [role=link]";

/**
 * Al probar el sitio, un clic sobre algo que no hace nada (un texto o una forma puesta encima de un botón) llega
 * a lo interactivo que hay justo debajo: una etiqueta sobre un rectángulo con interacción no tapa su clic.
 */
export function clickThrough(e: MouseEvent<HTMLElement>) {
  const target = e.target as Element;
  if (target.closest(RESPONDS)) return;
  const below = document
    .elementsFromPoint(e.clientX, e.clientY)
    .find((element) => element.hasAttribute("data-interactive") && !element.contains(target));
  if (!below) return;
  e.stopPropagation();
  (below as HTMLElement).click();
}
