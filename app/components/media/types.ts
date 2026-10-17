import type { ParsedMedia } from "./media-url";

export interface MediaItem extends ParsedMedia {
  id: string;
  /** true si `src` es un object URL creado con un archivo local (hay que liberarlo). */
  local: boolean;
}
