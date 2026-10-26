/** Degradados CSS: se construyen desde un modelo simple y se leen de vuelta para poder reeditarlos. */
export interface GradientStop {
  color: string;
  /** 0–100 (%). */
  position: number;
}

export interface Gradient {
  type: "linear" | "radial";
  /** Solo lineal: 0–360 grados (0 = hacia arriba, 90 = hacia la derecha). */
  angle: number;
  stops: GradientStop[];
}

export const DEFAULT_GRADIENT: Gradient = {
  type: "linear",
  angle: 135,
  stops: [
    { color: "#ff4d5e", position: 0 },
    { color: "#4d8dff", position: 100 },
  ],
};

const FUNCTION = /^(linear|radial)-gradient\(([\s\S]*)\)$/i;

export const isGradient = (value: string): boolean => FUNCTION.test(value.trim());

/** El texto CSS de un degradado: `linear-gradient(135deg, #ff4d5e 0%, #4d8dff 100%)`. */
export function buildGradient({ type, angle, stops }: Gradient): string {
  const list = [...stops]
    .sort((a, b) => a.position - b.position)
    .map((s) => `${s.color} ${Math.round(s.position)}%`)
    .join(", ");
  return type === "linear"
    ? `linear-gradient(${Math.round(angle)}deg, ${list})`
    : `radial-gradient(circle at 50% 50%, ${list})`;
}

/** Parte por comas de primer nivel (las de dentro de rgba(…) no cuentan). */
export function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") depth--;
    else if (text[i] === "," && depth === 0) {
      parts.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(text.slice(start).trim());
  return parts.filter(Boolean);
}

const DIRECTIONS: Record<string, number> = {
  "to top": 0, "to right": 90, "to bottom": 180, "to left": 270,
  "to top right": 45, "to bottom right": 135, "to bottom left": 225, "to top left": 315,
};

/** Un ángulo: «135deg» o «to right»; null si el texto no es una dirección (entonces es una parada). */
function angleOf(text: string): number | null {
  const deg = /^(-?[\d.]+)deg$/i.exec(text);
  if (deg) return ((Number(deg[1]) % 360) + 360) % 360;
  return DIRECTIONS[text.toLowerCase()] ?? null;
}

const STOP = /^(.*?)\s+(-?[\d.]+)%$/;

/** Las paradas sin posición se reparten de forma pareja, de 0 a 100. */
function parseStops(parts: string[]): GradientStop[] {
  return parts.map((part, i) => {
    const match = STOP.exec(part);
    const fallback = parts.length === 1 ? 0 : (i / (parts.length - 1)) * 100;
    return match ? { color: match[1], position: Number(match[2]) } : { color: part, position: fallback };
  });
}

/** Lee un degradado CSS lineal o radial; devuelve null si no es uno (o no tiene al menos 2 paradas). */
export function parseGradient(css: string): Gradient | null {
  const match = FUNCTION.exec(css.trim());
  if (!match) return null;

  const type = match[1].toLowerCase() as Gradient["type"];
  const parts = splitTopLevel(match[2]);
  const first = parts[0] ?? "";
  const angle = type === "linear" ? angleOf(first) : null;
  // La primera parte es la forma/dirección (no una parada) si es un ángulo o, en radial, empieza por forma/«at».
  const isHead = type === "linear" ? angle !== null : /^(circle|ellipse|closest|farthest|at\s)/i.test(first);
  const stops = parseStops(isHead ? parts.slice(1) : parts);
  return stops.length >= 2 ? { type, angle: angle ?? 180, stops } : null;
}
