import type { StepProp } from "./types";

const px = (value: string | number) => (typeof value === "number" ? `${value}px` : value);

/** Cómo se anima cada propiedad en el DOM (fotograma de la Web Animations API). Una propiedad nueva es una entrada nueva. */
export const STEP_PROPS: Record<StepProp, (value: string | number) => Keyframe> = {
  x: (value) => ({ left: px(value) }),
  y: (value) => ({ top: px(value) }),
  width: (value) => ({ width: px(value) }),
  height: (value) => ({ height: px(value) }),
  fontSize: (value) => ({ fontSize: px(value) }),
  radius: (value) => ({ borderRadius: px(value) }),
  fill: (value) => ({ backgroundColor: String(value) }),
  color: (value) => ({ color: String(value) }),
  opacity: (value) => ({ opacity: Number(value) }),
  // Propiedades de transformación sueltas: varias a la vez no se pisan entre sí.
  scale: (value) => ({ scale: String(value) }),
  rotate: (value) => ({ rotate: String(value) }),
  move: (value) => ({ translate: String(value) }),
  blur: (value) => ({ filter: `blur(${px(value)})` }),
  reveal: (value) => ({ clipPath: `inset(${value})` }),
};

/** Las propiedades que se graban solas al editar (el resto las ponen los efectos). */
export const TRACKED_PROPS = ["x", "y", "width", "height", "fill", "color", "fontSize", "radius"] as const satisfies readonly StepProp[];
export type TrackedProp = (typeof TRACKED_PROPS)[number];
