import type { Placement } from "../placement/types";
import type { ParsedMedia } from "./media-url";

export interface MediaItem extends ParsedMedia {
  id: string;
  /** true si `src` es un object URL creado con un archivo local (hay que liberarlo). */
  local: boolean;
  hidden?: boolean;
  /** Posición libre en la página; sin ella va en el flujo, tras los bloques. */
  placement?: Placement;
  /** Portada de un video: la imagen que se ve antes de reproducirlo. */
  poster?: string;
  /** true si `poster` es un object URL creado con un archivo local (hay que liberarlo). */
  posterLocal?: boolean;
}
