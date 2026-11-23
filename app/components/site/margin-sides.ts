import type { CSSProperties } from "react";

/**
 * Un `margin` abreviado (de 1 a 4 valores) como sus cuatro lados. React avisa si un mismo elemento alterna entre
 * `margin` y `marginLeft`/`marginRight`: por eso se escriben siempre los cuatro lados por separado.
 */
export function marginSides(shorthand: string | number | undefined): Pick<CSSProperties, "marginTop" | "marginRight" | "marginBottom" | "marginLeft"> {
  const parts = String(shorthand ?? "").trim().split(/\s+(?![^(]*\))/).filter(Boolean);
  const [top, right = top, bottom = top, left = right] = parts;
  return { marginTop: top, marginRight: right, marginBottom: bottom, marginLeft: left };
}
