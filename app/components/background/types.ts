/** Fondos con imagen o video para una sección o una página. */

export type BackgroundFit = "cover" | "contain" | "repeat";

/** Los 9 puntos de anclaje: arriba/centro/abajo × izquierda/centro/derecha. */
export type Anchor = "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br";

/** Un velo de color encima del fondo para que el texto se lea. */
export interface Veil {
  color: string;
  /** 0 a 100. */
  opacity: number;
}

export interface BlockBackground {
  kind: "image" | "video";
  /** URL (o datos, si se subió desde el equipo) de la imagen o del video. */
  src: string;
  /** true si `src` es un reproductor para <iframe> (YouTube, Vimeo). */
  embed?: boolean;
  /** Imagen que se ve mientras carga el video o si la persona pidió menos movimiento. */
  poster?: string;
  fit: BackgroundFit;
  anchor: Anchor;
  /** El fondo no se mueve al desplazar la página (parallax simple). */
  fixed: boolean;
  veil?: Veil;
  /** Desenfoque en píxeles (0 = nítido). */
  blur: number;
}

/** Cuánto ocupa una sección: lo que mide su contenido, todo el ancho de la página o toda la pantalla. */
export type BoxSpan = "content" | "width" | "screen";
