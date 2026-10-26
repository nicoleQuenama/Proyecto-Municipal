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
  fill: (value) => ({ background: String(value) }),
  color: (value) => ({ color: String(value) }),
  opacity: (value) => ({ opacity: Number(value) }),
  // Propiedades de transformación sueltas: varias a la vez no se pisan entre sí.
  scale: (value) => ({ scale: String(value) }),
  rotate: (value) => ({ rotate: String(value) }),
  move: (value) => ({ translate: String(value) }),
  blur: (value) => ({ filter: `blur(${px(value)})` }),
  reveal: (value) => ({ clipPath: `inset(${value})` }),
  // Resplandor: el número es el radio en px; el color de la luz es siempre cálido.
  glow: (value) => {
    const n = Number(value);
    return { boxShadow: `0 0 ${n}px ${n / 4}px rgba(250,204,21,${Math.min(1, n / 40)})` };
  },
  // Giro 3D sobre el eje vertical (grados) y inclinación 3D «x y» (grados), con perspectiva.
  flip: (value) => ({ transform: `perspective(800px) rotateY(${Number(value)}deg)` }),
  tilt: (value) => {
    const [x, y] = String(value).split(" ");
    return { transform: `perspective(800px) rotateX(${x}) rotateY(${y})` };
  },
};

/** Las propiedades que se graban solas al editar (el resto las ponen los efectos). */
export const TRACKED_PROPS = ["x", "y", "width", "height", "fill", "color", "fontSize", "radius"] as const satisfies readonly StepProp[];
export type TrackedProp = (typeof TRACKED_PROPS)[number];
