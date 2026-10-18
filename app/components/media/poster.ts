/** Reglas puras de la portada de un video. */

import type { MediaItem } from "./types";
import { parseImageUrl, type ParseResult } from "./media-url";

/** El id de YouTube de una URL de reproductor incrustado, si lo es. */
const YOUTUBE_EMBED = /youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/;

/** La miniatura que ya publica el proveedor del video, si se conoce (YouTube). */
export function providerThumbnail(item: MediaItem): string | null {
  const id = YOUTUBE_EMBED.exec(item.src)?.[1];
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

/** La URL del reproductor lista para empezar sola, que es lo que se espera tras pulsar la portada. */
export function autoplayUrl(src: string): string {
  const url = new URL(src);
  url.searchParams.set("autoplay", "1");
  return url.href;
}

/** Valida la URL de una imagen de portada. */
export function parsePosterUrl(input: string): ParseResult<string> {
  const parsed = parseImageUrl(input);
  return parsed.ok ? { ok: true, value: parsed.value.src } : parsed;
}

const MAX_POSTER_BYTES = 10 * 1024 * 1024;

/** El motivo por el que un archivo no sirve como portada, o `null` si sirve. */
export function posterFileProblem(file: File): string | null {
  if (!file.type.startsWith("image/")) return `«${file.name}» no es una imagen.`;
  if (file.size > MAX_POSTER_BYTES) return `«${file.name}» pesa más de 10 MB.`;
  return null;
}
