/** Del arrastre del ratón al rectángulo que se dibuja (lógica pura). */

import type { ElementKind } from "../site/types";

export interface Point {
  x: number;
  y: number;
}

/** La caja dibujada, en píxeles de la página. `flipped`: una línea que sube de izquierda a derecha. */
export interface DrawFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  flipped?: boolean;
}

export interface DrawInput {
  kind: ElementKind;
  start: Point;
  end: Point;
  /** Mayús: proporción 1:1 (en una línea, ángulos de 45°). */
  constrain: boolean;
  /** El tamaño de la página: lo dibujado no sale de ella. */
  bounds: { width: number; height: number };
}

/** Menos que esto es un clic, no un arrastre: se coloca la figura con su tamaño de partida. */
export const MIN_DRAG = 4;

/** El tamaño de una figura que se coloca con un clic. */
const CLICK_SIZE: Partial<Record<ElementKind, { width: number; height: number }>> = {
  rect: { width: 160, height: 100 },
  ellipse: { width: 120, height: 120 },
  triangle: { width: 120, height: 104 },
  line: { width: 160, height: 0 },
  text: { width: 200, height: 40 },
  icon: { width: 32, height: 32 },
};
const FALLBACK_SIZE = { width: 120, height: 100 };

type Constrainer = (dx: number, dy: number) => [number, number];

/** Proporción 1:1: el lado mayor manda y se conserva el sentido del arrastre. */
const square: Constrainer = (dx, dy) => {
  const side = Math.max(Math.abs(dx), Math.abs(dy));
  return [Math.sign(dx || 1) * side, Math.sign(dy || 1) * side];
};

/** Una línea con Mayús es horizontal, vertical o de 45°. */
const straightLine: Constrainer = (dx, dy) => {
  const [ax, ay] = [Math.abs(dx), Math.abs(dy)];
  if (ay < ax / 2) return [dx, 0];
  if (ax < ay / 2) return [0, dy];
  return square(dx, dy);
};

/** Lo que Mayús hace con el desplazamiento de cada figura; las que no están aquí usan 1:1. */
const CONSTRAIN: Partial<Record<ElementKind, Constrainer>> = { line: straightLine };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function frameFromDrag({ kind, start, end, constrain, bounds }: DrawInput): DrawFrame {
  const origin = { x: clamp(start.x, 0, bounds.width), y: clamp(start.y, 0, bounds.height) };
  let dx = clamp(end.x, 0, bounds.width) - origin.x;
  let dy = clamp(end.y, 0, bounds.height) - origin.y;

  if (Math.hypot(dx, dy) < MIN_DRAG) {
    const size = CLICK_SIZE[kind] ?? FALLBACK_SIZE;
    return {
      x: Math.round(clamp(origin.x, 0, Math.max(0, bounds.width - size.width))),
      y: Math.round(clamp(origin.y, 0, Math.max(0, bounds.height - size.height))),
      ...size,
    };
  }

  if (constrain) {
    [dx, dy] = (CONSTRAIN[kind] ?? square)(dx, dy);
    // Sin salirse de la página: se acorta por el lado que antes se acabe.
    const room = { x: dx >= 0 ? bounds.width - origin.x : origin.x, y: dy >= 0 ? bounds.height - origin.y : origin.y };
    const shrink = Math.min(1, dx === 0 ? 1 : room.x / Math.abs(dx), dy === 0 ? 1 : room.y / Math.abs(dy));
    [dx, dy] = [dx * shrink, dy * shrink];
  }

  return {
    x: Math.round(Math.min(origin.x, origin.x + dx)),
    y: Math.round(Math.min(origin.y, origin.y + dy)),
    width: Math.round(Math.abs(dx)),
    height: Math.round(Math.abs(dy)),
    ...(dx * dy < 0 ? { flipped: true } : {}),
  };
}
