/** `rgb(12, 34, 56)` → `#0c2238`, para los selectores de color. Lo que no es un color devuelve negro. */
export function toHex(css: string): string {
  const parts = css.match(/\d+(\.\d+)?/g)?.slice(0, 3).map(Number);
  if (!parts || parts.length < 3) return "#000000";
  return `#${parts.map((n) => Math.round(n).toString(16).padStart(2, "0")).join("")}`;
}

/** `16px` → `16`. */
export const toPixels = (css: string): string => String(Math.round(parseFloat(css) || 0));
