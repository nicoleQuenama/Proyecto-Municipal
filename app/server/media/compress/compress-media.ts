import type { MediaType } from "../sniff";
import { compressImage } from "./images";
import { LOSSLESS_PSNR } from "./psnr";
import type { CompressionReport, ImageType, Outcome, VideoType } from "./types";
import { compressVideo } from "./video";

/** Si no se ahorra al menos esto, no vale la pena cambiar el archivo del usuario. */
const MIN_SAVING = 0.03;
/** «No se nota»: por debajo de ~40 dB empiezan a verse diferencias en imágenes; en video, el promedio de todos los cuadros baja un poco más. */
const IMAGE_MIN_PSNR = 40;
const VIDEO_MIN_PSNR = 38;

type Compressor = (data: Buffer, maxBytes: number) => Promise<Outcome | null>;
const image = (type: ImageType, minPsnr = IMAGE_MIN_PSNR): Compressor => (data, maxBytes) => compressImage(data, type, minPsnr, maxBytes);
const video = (type: VideoType, minPsnr = VIDEO_MIN_PSNR): Compressor => (data, maxBytes) => compressVideo(data, type, minPsnr, maxBytes);

/** Qué compresor y qué exigencia de calidad tiene cada formato permitido. */
const COMPRESSORS: Record<MediaType, Compressor> = {
  "image/png": image("image/png", LOSSLESS_PSNR),
  "image/jpeg": image("image/jpeg"),
  "image/webp": image("image/webp"),
  "image/avif": image("image/avif"),
  "image/gif": image("image/gif"),
  "video/mp4": video("video/mp4"),
  "video/webm": video("video/webm"),
};

const percent = (part: number, whole: number) => Math.round((part / whole) * 1000) / 10;

/**
 * Comprime un archivo en su mismo formato SIN perder calidad visible: solo se queda con un resultado que pasa la prueba de
 * calidad (PSNR) y pesa al menos un 3 % menos. En cualquier otro caso, o si algo falla, devuelve el original intacto.
 */
export async function compressMedia(data: Buffer, type: MediaType): Promise<{ data: Buffer; report: CompressionReport }> {
  const started = Date.now();
  const kept = (reason: string) => ({ data, report: { type, originalBytes: data.length, finalBytes: data.length, savedPercent: 0, applied: false, step: null, psnr: null, reason, ms: Date.now() - started } });
  try {
    const outcome = await COMPRESSORS[type](data, Math.floor(data.length * (1 - MIN_SAVING)));
    if (!outcome) return kept("ningún ajuste conservó la calidad con un ahorro de al menos 3 %");
    return {
      data: outcome.data,
      report: { type, originalBytes: data.length, finalBytes: outcome.data.length, savedPercent: percent(data.length - outcome.data.length, data.length), applied: true, step: outcome.step, psnr: Math.round(outcome.psnr * 10) / 10, reason: null, ms: Date.now() - started },
    };
  } catch (error) {
    return kept(error instanceof Error ? error.message : "error al comprimir");
  }
}
