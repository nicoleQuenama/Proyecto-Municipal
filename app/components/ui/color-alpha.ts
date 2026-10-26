/** Un color separado en su tono (#rrggbb) y su opacidad (0–1), para poder editarlos por separado. */
export interface ColorParts {
  hex: string;
  alpha: number;
}

const byte = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, "0");
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FUNCTIONAL = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+)(%?))?\s*\)$/i;

/** Lee #hex (3, 4, 6 u 8 cifras) y rgb()/rgba(); cualquier otra cosa (var(), nombres…) devuelve null. */
export function parseColor(value: string): ColorParts | null {
  const text = value.trim();
  if (HEX.test(text)) {
    const digits = text.slice(1);
    const full = digits.length <= 4 ? [...digits].map((c) => c + c).join("") : digits;
    const alpha = full.length === 8 ? parseInt(full.slice(6), 16) / 255 : 1;
    return { hex: `#${full.slice(0, 6).toLowerCase()}`, alpha: Math.round(alpha * 100) / 100 };
  }
  const match = FUNCTIONAL.exec(text);
  if (!match) return null;
  const [, r, g, b, a, percent] = match;
  const alpha = a === undefined ? 1 : percent ? Number(a) / 100 : Number(a);
  return { hex: `#${byte(+r)}${byte(+g)}${byte(+b)}`, alpha: clamp01(alpha) };
}

/** Une tono y opacidad: opaco queda como #hex y con transparencia como rgba(). */
export function composeColor({ hex, alpha }: ColorParts): string {
  const a = Math.round(clamp01(alpha) * 100) / 100;
  if (a >= 1) return hex;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
