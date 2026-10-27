/** Un color escrito a mano: «0b1026», «#0B1026» o «#fff». Devuelve `#rrggbb` en minúsculas, o `null` si no es un color. */
export function normalizeHex(input: string): string | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (!match) return null;
  const digits = match[1].length === 3 ? [...match[1]].map((d) => d + d).join("") : match[1];
  return `#${digits.toLowerCase()}`;
}
