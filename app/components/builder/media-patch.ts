/** Qué cambia en un elemento al darle contenido (lógica pura salvo la lectura del archivo). */

import { imageFileProblem, readAsDataUrl } from "../media/image-file";
import { parseImageUrl, parseVideoUrl, type ParseResult } from "../media/media-url";
import type { CanvasElement } from "../site/types";

export type MediaPatch = Partial<Pick<CanvasElement, "src" | "embed" | "poster">>;
export type MediaKind = "image" | "video";

/** Qué hace un archivo de imagen soltado o subido: en una imagen es el contenido; en un video, su portada. */
const FILE_PATCH: Record<MediaKind, (dataUrl: string) => MediaPatch> = {
  image: (src) => ({ src, embed: false }),
  video: (poster) => ({ poster }),
};

/** Cómo se valida la URL pegada, por tipo de elemento. */
const URL_PATCH: Record<MediaKind, (input: string) => ParseResult<MediaPatch>> = {
  image: (input) => {
    const result = parseImageUrl(input);
    return result.ok ? { ok: true, value: { src: result.value.src, embed: false } } : result;
  },
  video: (input) => {
    const result = parseVideoUrl(input);
    return result.ok ? { ok: true, value: { src: result.value.src, embed: result.value.embed } } : result;
  },
};

export const isMediaKind = (kind: string): kind is MediaKind => kind === "image" || kind === "video";

export const patchFromUrl = (kind: MediaKind, input: string) => URL_PATCH[kind](input);

/** El cambio que produce un archivo, o el motivo por el que no sirve. */
export async function patchFromFile(kind: MediaKind, file: File): Promise<ParseResult<MediaPatch>> {
  const problem = imageFileProblem(file);
  if (problem) return { ok: false, error: problem };
  try {
    return { ok: true, value: FILE_PATCH[kind](await readAsDataUrl(file)) };
  } catch (failure) {
    return { ok: false, error: failure instanceof Error ? failure.message : "No se pudo leer el archivo." };
  }
}
