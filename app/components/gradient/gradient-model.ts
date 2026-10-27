/** Un degradado lineal editable: su ángulo y sus puntos de color (lógica pura, sin React). */

export interface GradientStop {
  color: string;
  /** De 0 a 100, a lo largo de la línea del degradado. */
  position: number;
}

export interface Gradient {
  /** Como en CSS: 0° apunta hacia arriba y crece en el sentido del reloj. */
  angle: number;
  stops: GradientStop[];
}

export interface Point {
  x: number;
  y: number;
}

export const MIN_STOPS = 2;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const radians = (angle: number) => (angle * Math.PI) / 180;

export function toCss({ angle, stops }: Gradient): string {
  const ordered = [...stops].sort((a, b) => a.position - b.position);
  return `linear-gradient(${Math.round(angle)}deg, ${ordered.map((s) => `${s.color} ${Math.round(s.position)}%`).join(", ")})`;
}

/** Lee un `linear-gradient(<ángulo>deg, color pos%, …)`; cualquier otra cosa (un color, un degradado radial) devuelve null. */
export function parseGradient(css: string | undefined): Gradient | null {
  const match = /^linear-gradient\(\s*(-?[\d.]+)deg\s*,([\s\S]*)\)$/.exec(css?.trim() ?? "");
  if (!match) return null;
  const stops = match[2]
    .split(/,(?![^(]*\))/)
    .map((part) => /^\s*(.+?)\s+(-?[\d.]+)%\s*$/.exec(part))
    .map((m) => (m ? { color: m[1], position: clamp(Number(m[2]), 0, 100) } : null));
  return stops.length >= MIN_STOPS && stops.every((s) => s !== null) ? { angle: Number(match[1]), stops: stops as GradientStop[] } : null;
}

/** El degradado con el que se empieza: de un color a otro, en diagonal. */
export const defaultGradient = (from = "#3b82f6", to = "#8b5cf6"): Gradient => ({
  angle: 135,
  stops: [
    { color: from, position: 0 },
    { color: to, position: 100 },
  ],
});

/** Añade un punto en esa posición, con el color del punto más cercano. */
export function addStop(gradient: Gradient, position: number): Gradient {
  const nearest = gradient.stops.reduce((best, s) => (Math.abs(s.position - position) < Math.abs(best.position - position) ? s : best));
  return { ...gradient, stops: [...gradient.stops, { color: nearest.color, position: clamp(position, 0, 100) }] };
}

export const moveStop = (gradient: Gradient, index: number, position: number): Gradient => ({
  ...gradient,
  stops: gradient.stops.map((s, i) => (i === index ? { ...s, position: clamp(position, 0, 100) } : s)),
});

export const setStopColor = (gradient: Gradient, index: number, color: string): Gradient => ({
  ...gradient,
  stops: gradient.stops.map((s, i) => (i === index ? { ...s, color } : s)),
});

/** Quita un punto; siempre quedan al menos dos. */
export const removeStop = (gradient: Gradient, index: number): Gradient =>
  gradient.stops.length <= MIN_STOPS ? gradient : { ...gradient, stops: gradient.stops.filter((_, i) => i !== index) };

export const setAngle = (gradient: Gradient, angle: number): Gradient => ({ ...gradient, angle: ((Math.round(angle) % 360) + 360) % 360 });

/** El largo de la línea del degradado dentro de una caja (la que usa CSS: de esquina a esquina según el ángulo). */
export const lineLength = (width: number, height: number, angle: number): number =>
  Math.abs(width * Math.sin(radians(angle))) + Math.abs(height * Math.cos(radians(angle)));

const direction = (angle: number): Point => ({ x: Math.sin(radians(angle)), y: -Math.cos(radians(angle)) });

/** Dónde cae un punto de la línea (0–100 %) sobre la caja, que está centrada en `center`. */
export function pointAt(center: Point, angle: number, length: number, position: number): Point {
  const d = direction(angle);
  const t = (position / 100 - 0.5) * length;
  return { x: center.x + d.x * t, y: center.y + d.y * t };
}

/** La posición (0–100 %) de la línea más cercana a un punto: sirve para arrastrar un punto de color. */
export function positionOf(center: Point, angle: number, length: number, point: Point): number {
  const d = direction(angle);
  const t = (point.x - center.x) * d.x + (point.y - center.y) * d.y;
  return clamp((t / length + 0.5) * 100, 0, 100);
}

/** El ángulo al que apunta el centro hacia un punto: sirve para girar el degradado arrastrando. */
export function angleOf(center: Point, point: Point): number {
  return (Math.atan2(point.x - center.x, -(point.y - center.y)) * 180) / Math.PI;
}
