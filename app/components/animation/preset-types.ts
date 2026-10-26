import type { StepProp } from "./types";

/** Los ajustes que la persona mueve con deslizadores; cada efecto los usa como quiera. */
export interface PresetParams {
  /** ms que dura el efecto entero. */
  duration: number;
  /** ms que espera antes de empezar. */
  delay: number;
  /** ms de diferencia entre un elemento y el siguiente (cascada). */
  stagger: number;
  /** Cuánto se desplaza o crece: píxeles de recorrido, o fuerza del efecto. */
  distance: number;
}

/** Un tramo del efecto: una propiedad que va de `from` a `to` durante una parte de la duración (0 a 1). */
export interface Part {
  prop: StepProp;
  from: string | number;
  to: string | number;
  start?: number;
  span?: number;
  /** Aceleración propia del tramo (solo en efectos con `ownEasing`). */
  easing?: string;
  /** Repeticiones (0 = sin fin). Solo para efectos de un único tramo. */
  iterations?: number;
  direction?: "normal" | "alternate";
}

export interface Preset {
  label: string;
  icon: string;
  /** Con duración fija el efecto es instantáneo (aparecer «de golpe»). */
  instant?: boolean;
  /** El efecto trae su propia aceleración: no se elige. */
  ownEasing?: boolean;
  /** Multiplica la duración elegida (efectos lentos, como el zoom suave). */
  durationScale?: number;
  parts: (p: PresetParams) => Part[];
}
