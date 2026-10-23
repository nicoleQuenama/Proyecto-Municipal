import type { StepProp } from "./types";

/** Cómo se escribe el valor de una propiedad en el editor. */
export type FieldKind = "number" | "color" | "pair" | "angle" | "text";

interface StepMeta {
  label: string;
  field: FieldKind;
  /** Color de la barra en la línea de tiempo. */
  bar: string;
  /** Para los campos numéricos: lo que sube o baja cada paso. */
  step?: number;
}

/** Cómo se llama, se edita y se ve cada propiedad animable. Una propiedad nueva es una entrada nueva. */
export const STEP_META: Record<StepProp, StepMeta> = {
  x: { label: "Posición X", field: "number", bar: "bg-sky-500" },
  y: { label: "Posición Y", field: "number", bar: "bg-sky-500" },
  width: { label: "Ancho", field: "number", bar: "bg-teal-500" },
  height: { label: "Alto", field: "number", bar: "bg-teal-500" },
  fontSize: { label: "Tamaño de letra", field: "number", bar: "bg-teal-500" },
  radius: { label: "Esquinas", field: "number", bar: "bg-teal-500" },
  fill: { label: "Color de fondo", field: "color", bar: "bg-pink-500" },
  color: { label: "Color de texto", field: "color", bar: "bg-pink-500" },
  opacity: { label: "Visibilidad", field: "number", bar: "bg-amber-500", step: 0.05 },
  scale: { label: "Tamaño", field: "number", bar: "bg-violet-500", step: 0.05 },
  rotate: { label: "Giro", field: "angle", bar: "bg-violet-500" },
  move: { label: "Desplazamiento", field: "pair", bar: "bg-sky-500" },
  blur: { label: "Desenfoque", field: "number", bar: "bg-amber-500" },
  reveal: { label: "Revelado", field: "text", bar: "bg-amber-500" },
};
