import { isBackdrop } from "../canvas-editing/backdrop";
import type { ComponentDef } from "../site/types";
import type { MenuConfig } from "./types";

const NO_FILL = new Set(["", "transparent", "none"]);
const LIGHT = "#ffffff";
const DARK = "#0f172a";
/** Contraste mínimo (WCAG, texto grande) por debajo del cual se cambia el color del texto. */
const MIN_CONTRAST = 3;

/** Los canales 0–255 de un color `#rgb` o `#rrggbb`; `null` si es otra cosa (rgba, variable, degradado…). */
function channels(color: string): [number, number, number] | null {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())?.[1];
  if (!hex) return null;
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance([r, g, b]: [number, number, number]): number {
  const [lr, lg, lb] = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

/** La razón de contraste entre dos colores; `null` si alguno no se puede leer. */
export function contrast(a: string, b: string): number | null {
  const [ca, cb] = [channels(a), channels(b)];
  if (!ca || !cb) return null;
  const [high, low] = [luminance(ca), luminance(cb)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

/** El fondo del panel: el elegido, el de la sección, el del rectángulo que la cubre o blanco. */
export function panelBackground(view: ComponentDef, config: MenuConfig, sectionBackground?: string): string {
  const size = { width: view.width, height: view.height };
  const backdrop = view.elements.find((e) => e.kind === "rect" && !e.hidden && !NO_FILL.has(e.fill) && isBackdrop(e, size));
  return config.panelBackground || sectionBackground || backdrop?.fill || LIGHT;
}

/** El color del texto: el elegido; si no, el del elemento, salvo que no se lea sobre el fondo (entonces claro u oscuro). */
export function panelText(background: string, preferred: string, chosen?: string): string {
  if (chosen) return chosen;
  const ratio = contrast(background, preferred);
  if (ratio === null || ratio >= MIN_CONTRAST) return preferred;
  const bg = channels(background);
  return bg && luminance(bg) < 0.4 ? LIGHT : DARK;
}
