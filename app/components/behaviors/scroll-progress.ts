/**
 * Cuánto ha avanzado una pieza por la pantalla al hacer scroll: 0 cuando asoma por abajo, 1 cuando acaba de salir por arriba.
 */
export function scrollProgress(box: { top: number; height: number }, viewportHeight: number): number {
  const travelled = (viewportHeight - box.top) / (viewportHeight + box.height);
  return Math.min(1, Math.max(0, travelled));
}
