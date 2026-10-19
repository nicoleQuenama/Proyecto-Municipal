/** Dónde está un elemento de la página puesto en posición libre, desde la esquina de la página. Sin colocación va en el flujo. */
export interface Placement {
  x: number;
  y: number;
  /** Ancho que tenía al soltarlo: lo usan el titular y los medios, que no tienen uno propio. */
  width: number;
}
