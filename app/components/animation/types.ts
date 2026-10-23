/** Lo que una animación grabada puede cambiar de un elemento (o de una sección entera). */
export type StepProp =
  | "x" | "y" | "width" | "height" | "fill" | "color" | "fontSize" | "radius"
  | "opacity" | "scale" | "rotate" | "move" | "blur" | "reveal";

/**
 * Un paso de una animación: una propiedad pasa de `from` a `to`, empezando `at` ms después del inicio
 * y durando `duration` ms. El destino es un elemento del bloque, o la sección entera con `SECTION_KEY`.
 */
export interface AnimationStep {
  id: string;
  blockId: string;
  key: string;
  prop: StepProp;
  from: string | number;
  to: string | number;
  at: number;
  duration: number;
  /** Cómo acelera (CSS `easing`); sin él, suave. */
  easing?: string;
  /** Solo mientras se graba: el gesto (arrastre, selector de color…) del que viene el cambio. */
  gesture?: number;
}

/** Una animación guardada en una página. */
export interface RecordedAnimation {
  id: string;
  name: string;
  steps: AnimationStep[];
}
