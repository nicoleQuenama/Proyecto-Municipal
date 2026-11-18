import type { CodeSource } from "../site/types";
import { TAILWIND_PALETTE } from "./tailwind-palette";

type Field = "html" | "css" | "js";
const FIELDS: Field[] = ["css", "html", "js"];

/** Un color encontrado en el código: dónde está y cómo se reescribe con otro color. */
interface Match {
  field: Field;
  start: number;
  end: number;
  rewrite: (hex: string) => string;
}

/** Un color del código y todo lo que lo usa. `value` es `#rrggbb` en minúsculas. */
export interface CodeColorGroup {
  value: string;
  matches: Match[];
}

/** Las utilidades de Tailwind que llevan un color: `bg-sky-900`, `text-white`, `border-red-500/50`… */
const PREFIXES = "bg|text|border|fill|stroke|from|via|to|ring|outline|decoration|shadow|accent|caret|divide|placeholder";

/**
 * Tres formas de escribir un color, en una sola búsqueda: una clase de la paleta de Tailwind, rgb()/rgba(), o un
 * hexadecimal (3, 6 u 8 dígitos). No toma un ancla (`href="#faq"`) ni una entidad (`&#9776;`).
 */
const COLOR = new RegExp(
  [
    `(?<![\\w-])(?<prefix>${PREFIXES})-(?<name>[a-z]+-\\d{2,3}|white|black)(?<opacity>/\\d{1,3})?(?![\\w-])`,
    `(?<rgb>rgba?\\(\\s*(?<r>\\d{1,3})[\\s,]+(?<g>\\d{1,3})[\\s,]+(?<b>\\d{1,3})(?:\\s*[,/]\\s*(?<alpha>[\\d.]+%?))?\\s*\\))`,
    `(?<![\\w&])(?<!href=["'])(?<hex>#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3}))(?![\\w-])`,
  ].join("|"),
  "gi",
);

const toHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((n) => Math.min(255, n).toString(16).padStart(2, "0")).join("")}`;

const channels = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

/** Cómo se lee cada forma de escribir un color: su valor `#rrggbb` y cómo se reescribe con otro. Una forma nueva es una entrada nueva. */
const READERS: Record<string, (groups: Record<string, string | undefined>) => { value: string; rewrite: (hex: string) => string } | null> = {
  name: (g) => {
    const value = TAILWIND_PALETTE[g.name!.toLowerCase()];
    // Una clase de la paleta pasa a un color entre corchetes: `bg-sky-900/50` → `bg-[#ff0000]/50`.
    return value ? { value, rewrite: (hex) => `${g.prefix}-[${hex}]${g.opacity ?? ""}` } : null;
  },
  rgb: (g) => {
    const [r, gr, b] = [g.r, g.g, g.b].map(Number);
    if ([r, gr, b].some((n) => n > 255)) return null;
    return {
      value: toHex(r, gr, b),
      rewrite: (hex) => {
        const [nr, ng, nb] = channels(hex);
        return g.alpha === undefined ? hex : `rgba(${nr}, ${ng}, ${nb}, ${g.alpha})`;
      },
    };
  },
  hex: (g) => {
    const digits = g.hex!.slice(1).toLowerCase();
    const full = digits.length === 3 ? [...digits].map((d) => d + d).join("") : digits;
    const alpha = full.slice(6);
    return { value: `#${full.slice(0, 6)}`, rewrite: (hex) => hex + alpha };
  },
};

const readerOf = (groups: Record<string, string | undefined>) => {
  const kind = ["name", "rgb", "hex"].find((key) => groups[key] !== undefined);
  return kind ? READERS[kind](groups) : null;
};

/** Los colores distintos escritos a mano en el código de un bloque (CSS, HTML y TypeScript), en el orden en que aparecen. */
export function findCodeColors(code: CodeSource): CodeColorGroup[] {
  const groups = new Map<string, CodeColorGroup>();

  for (const field of FIELDS) {
    for (const found of code[field].matchAll(COLOR)) {
      const read = readerOf(found.groups ?? {});
      if (!read) continue;
      const group = groups.get(read.value) ?? { value: read.value, matches: [] };
      group.matches.push({ field, start: found.index, end: found.index + found[0].length, rewrite: read.rewrite });
      groups.set(read.value, group);
    }
  }
  return [...groups.values()];
}

/** El código con un color cambiado por otro en todos los lugares donde aparece. Lo demás queda igual. */
export function recolorCode(code: CodeSource, value: string, color: string): CodeSource {
  const group = findCodeColors(code).find((g) => g.value === value);
  if (!group || value === color.toLowerCase()) return code;

  const next = { ...code };
  // De atrás hacia adelante, para que las posiciones anteriores no cambien.
  for (const match of [...group.matches].sort((a, b) => b.start - a.start)) {
    next[match.field] = next[match.field].slice(0, match.start) + match.rewrite(color.toLowerCase()) + next[match.field].slice(match.end);
  }
  return next;
}
