import type { CSSProperties } from "react";
import type { CanvasElement, TextAlign } from "../site/types";
import { pixelsOf } from "../styles/apply";
import { variableNameOf } from "../styles/resolve";

/** Lo que el menú de formato ofrece. Para añadir una opción basta con una entrada nueva en su tabla. */

type ToggleKey = "bold" | "italic" | "underline" | "overline" | "strike";

export interface ToggleOption {
  key: ToggleKey;
  label: string;
  glyph: string;
  /** Cómo se dibuja el botón, para que se vea lo que hace. */
  glyphStyle: CSSProperties;
}

export const TOGGLES: ToggleOption[] = [
  { key: "bold", label: "Negrita", glyph: "B", glyphStyle: { fontWeight: 700 } },
  { key: "italic", label: "Cursiva", glyph: "I", glyphStyle: { fontStyle: "italic" } },
  { key: "underline", label: "Subrayado", glyph: "U", glyphStyle: { textDecoration: "underline" } },
  { key: "overline", label: "Sobrelínea", glyph: "O", glyphStyle: { textDecoration: "overline" } },
  { key: "strike", label: "Tachado", glyph: "S", glyphStyle: { textDecoration: "line-through" } },
];

export const ALIGNS: { value: TextAlign; label: string; glyph: string }[] = [
  { value: "left", label: "Alinear a la izquierda", glyph: "⇤" },
  { value: "center", label: "Centrar", glyph: "≡" },
  { value: "right", label: "Alinear a la derecha", glyph: "⇥" },
];

export const LISTS: { value: NonNullable<CanvasElement["list"]>; label: string; glyph: string }[] = [
  { value: "ul", label: "Lista con viñetas", glyph: "•" },
  { value: "ol", label: "Lista numerada", glyph: "1." },
];

/** Cuánto se mueve un elemento (px) con cada flecha. */
const MOVE_STEP = 10;

export const MOVE_STEPS = [
  { label: "Mover a la izquierda", glyph: "←", dx: -MOVE_STEP, dy: 0 },
  { label: "Mover a la derecha", glyph: "→", dx: MOVE_STEP, dy: 0 },
  { label: "Mover arriba", glyph: "↑", dx: 0, dy: -MOVE_STEP },
  { label: "Mover abajo", glyph: "↓", dx: 0, dy: MOVE_STEP },
];

export const MAX_RADIUS = 60;
export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 120;

const HEX_6 = /^#[0-9a-f]{6}$/i;
const HEX_3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;

/** `<input type="color">` solo entiende #rrggbb; cualquier otro valor (transparent, rgb…) se muestra en negro. */
export function colorInputValue(value: string | undefined, fallback = "#000000"): string {
  if (!value) return fallback;
  if (HEX_6.test(value)) return value.toLowerCase();

  const short = HEX_3.exec(value);
  return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase() : fallback;
}

/** Lo que se guarda para un tamaño: `var(--nombre)` tal cual, o los píxeles de un valor suelto ("12px" → 12). */
export function toSizeValue(raw: string): number | string {
  return variableNameOf(raw) !== null ? raw : pixelsOf(raw, 0);
}
