/** Colores CSS → números, y contraste WCAG (puro). Entiende #hex, rgb(), hsl(), degradados y unos nombres. */

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const NAMES: Record<string, string> = {
  white: "#ffffff", black: "#000000", red: "#ff0000", green: "#008000", blue: "#0000ff",
  gray: "#808080", grey: "#808080", yellow: "#ffff00", orange: "#ffa500", purple: "#800080", transparent: "rgba(0,0,0,0)",
};

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FN = /^(rgba?|hsla?)\(([^)]*)\)$/i;
const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

function fromHex(text: string): Rgba {
  const d = text.slice(1);
  const full = d.length <= 4 ? [...d].map((c) => c + c).join("") : d;
  const n = (i: number) => parseInt(full.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: full.length === 8 ? n(6) / 255 : 1 };
}

function fromHsl(h: number, s: number, l: number, a: number): Rgba {
  const k = (n: number) => (n + h / 30) % 12;
  const f = (n: number) => l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255, a };
}

/** Lee un color simple; cualquier otra cosa (var(), degradado…) devuelve null. */
export function parseCssColor(value: string): Rgba | null {
  const text = (NAMES[value.trim().toLowerCase()] ?? value).trim();
  if (HEX.test(text)) return fromHex(text);
  const match = FN.exec(text);
  if (!match) return null;
  const parts = match[2].split(/[\s,/]+/).filter(Boolean);
  const num = (s: string | undefined, scale = 1) => (s === undefined ? 1 : s.endsWith("%") ? parseFloat(s) / 100 : parseFloat(s) / scale);
  const alpha = parts[3] === undefined ? 1 : clamp(num(parts[3]));
  if (match[1].toLowerCase().startsWith("hsl")) {
    return fromHsl(parseFloat(parts[0]), clamp(num(parts[1])), clamp(num(parts[2])), alpha);
  }
  const channel = (s: string) => (s.endsWith("%") ? (parseFloat(s) / 100) * 255 : parseFloat(s));
  return { r: channel(parts[0]), g: channel(parts[1]), b: channel(parts[2]), a: alpha };
}

/** Un degradado se resume en su color medio (la media de sus paradas). */
export function averageColor(value: string): Rgba | null {
  const simple = parseCssColor(value);
  if (simple) return simple;
  if (!/gradient\(/i.test(value)) return null;
  const stops = value.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi)?.map(parseCssColor).filter((c): c is Rgba => c !== null);
  if (!stops?.length) return null;
  const mean = (key: keyof Rgba) => stops.reduce((sum, c) => sum + c[key], 0) / stops.length;
  return { r: mean("r"), g: mean("g"), b: mean("b"), a: mean("a") };
}

/** Pone `top` (con su opacidad) sobre un fondo opaco. */
export const blend = (top: Rgba, bottom: Rgba): Rgba => ({
  r: top.r * top.a + bottom.r * (1 - top.a),
  g: top.g * top.a + bottom.g * (1 - top.a),
  b: top.b * top.a + bottom.b * (1 - top.a),
  a: 1,
});

const lin = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ({ r, g, b }: Rgba) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

/** Razón de contraste WCAG entre dos colores opacos (1 a 21). */
export function contrastRatio(a: Rgba, b: Rgba): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export const toHex = ({ r, g, b }: Rgba): string =>
  `#${[r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("")}`;

/** El color más parecido a `text` que llega a `minRatio` sobre `bg` (oscureciendo o aclarando). */
export function readableOn(text: Rgba, bg: Rgba, minRatio = 4.5): string {
  const towardBlack = contrastRatio({ r: 0, g: 0, b: 0, a: 1 }, bg) >= contrastRatio({ r: 255, g: 255, b: 255, a: 1 }, bg);
  const target = towardBlack ? 0 : 255;
  for (let step = 0; step <= 20; step++) {
    const t = step / 20;
    const mix = (v: number) => v + (target - v) * t;
    const candidate = { r: mix(text.r), g: mix(text.g), b: mix(text.b), a: 1 };
    if (contrastRatio(candidate, bg) >= minRatio) return toHex(candidate);
  }
  return towardBlack ? "#000000" : "#ffffff";
}
