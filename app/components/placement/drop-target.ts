export interface FlowRect {
  id: string;
  top: number;
  bottom: number;
}

/**
 * Dónde cae una sección que se arrastra por el flujo: antes de la primera cuyo centro queda por debajo del puntero,
 * o al final si el puntero pasó de todas. `lineY` es dónde dibujar la línea guía.
 */
export function dropTarget(siblings: FlowRect[], pointerY: number): { beforeId: string | null; lineY: number } {
  const next = siblings.find((s) => (s.top + s.bottom) / 2 > pointerY);
  if (next) return { beforeId: next.id, lineY: next.top };
  const last = siblings.at(-1);
  return { beforeId: null, lineY: last ? last.bottom : pointerY };
}
