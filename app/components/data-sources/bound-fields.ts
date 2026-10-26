import type { CSSProperties } from "react";
import type { CanvasElement, ElementKind } from "../site/types";
import { asText, isListValue } from "./as-text";
import type { BoundField, DataRef } from "./types";

interface BoundFieldDef {
  label: string;
  /** En qué tipos de elemento tiene sentido. */
  kinds: ElementKind[];
  /** Lo que el dato cambia del elemento. */
  apply: (element: CanvasElement, value: unknown, ref: DataRef) => Partial<CanvasElement>;
  /** Pide un valor máximo: el dato es una parte de él (una barra al 60 % de 100). */
  ranged?: boolean;
}

const TEXT_KINDS: ElementKind[] = ["rect", "ellipse", "text"];
const BOX_KINDS: ElementKind[] = ["rect", "ellipse", "text", "image"];

/** La parte del largo del elemento que corresponde al dato (entre 0 y el máximo). */
const share = (value: unknown, ref: DataRef, full: number): number | null => {
  const number = Number(value);
  if (value === "" || value === null || !Number.isFinite(number)) return null;
  return Math.max(1, Math.round(full * Math.min(1, Math.max(0, number / (ref.max || 100)))));
};

/** Qué parte de un elemento puede llenar un dato. Una nueva es una entrada nueva. */
export const BOUND_FIELDS: Record<BoundField, BoundFieldDef> = {
  text: {
    label: "Texto",
    kinds: TEXT_KINDS,
    // Una lista de datos se dibuja como lista con viñetas, salvo que el elemento ya tenga otra clase de lista.
    apply: (element, value) => ({ text: asText(value), ...(isListValue(value) && !element.list ? { list: "ul" as const } : {}) }),
  },
  src: { label: "Imagen o video", kinds: ["image", "video"], apply: (_el, value) => ({ src: asText(value) }) },
  fill: { label: "Color de fondo", kinds: ["rect", "ellipse", "text"], apply: (_el, value) => ({ fill: String(value) }) },
  color: { label: "Color de texto", kinds: TEXT_KINDS, apply: (_el, value) => ({ color: String(value) }) },
  width: {
    label: "Ancho (barra)",
    kinds: BOX_KINDS,
    ranged: true,
    apply: (element, value, ref) => {
      const width = share(value, ref, element.width);
      return width === null ? {} : { width };
    },
  },
  height: {
    label: "Alto (barra)",
    kinds: BOX_KINDS,
    ranged: true,
    apply: (element, value, ref) => {
      const height = share(value, ref, element.height);
      return height === null ? {} : { height };
    },
  },
};

/** Lo que llena un dato si no se elige otra cosa. */
const DEFAULT_FIELD: Record<ElementKind, BoundField> = { rect: "text", ellipse: "text", triangle: "text", line: "text", text: "text", image: "src", video: "src", icon: "text" };

/** La parte que llena este dato en este elemento (lo elegido, si tiene sentido para el tipo). */
export const fieldOf = (ref: DataRef, kind: ElementKind): BoundField =>
  ref.as && BOUND_FIELDS[ref.as].kinds.includes(kind) ? ref.as : DEFAULT_FIELD[kind];

/** Las partes que un elemento puede llenar, para ofrecerlas al elegir. */
export const fieldsFor = (kind: ElementKind): BoundField[] =>
  (Object.keys(BOUND_FIELDS) as BoundField[]).filter((field) => BOUND_FIELDS[field].kinds.includes(kind));

/**
 * Lo que un dato cambia del aspecto de un elemento, como estilo de su contenedor: la posición, el tamaño y el color
 * base se pintan desde CSS en el contenedor, así que el cambio tiene que ir allí.
 */
export function boundBoxStyle(base: CanvasElement, shown: CanvasElement): CSSProperties {
  const css: CSSProperties = {};
  if (shown.width !== base.width) css.width = shown.width;
  if (shown.height !== base.height) css.height = shown.height;
  if (shown.fill !== base.fill) css.background = shown.fill;
  if (shown.color !== base.color) css.color = shown.color;
  return css;
}
