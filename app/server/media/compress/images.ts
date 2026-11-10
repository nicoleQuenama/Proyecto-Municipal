import type { Sharp } from "sharp";
import { openImage, psnrBetween } from "./psnr";
import type { ImageType, Outcome } from "./types";

interface Rung {
  label: string;
  encode: (image: Sharp) => Sharp;
}

const jpeg = (quality: number): Rung => ({ label: `JPEG mozjpeg q${quality}`, encode: (s) => s.jpeg({ quality, mozjpeg: true, chromaSubsampling: quality >= 90 ? "4:4:4" : "4:2:0" }) });
const webp = (quality: number): Rung => ({ label: `WebP q${quality}`, encode: (s) => s.webp({ quality, effort: 5 }) });
const avif = (quality: number): Rung => ({ label: `AVIF q${quality}`, encode: (s) => s.avif({ quality, effort: 4 }) });

/**
 * Los ajustes de cada formato, de menos a más calidad: se usa el PRIMERO cuyo resultado pasa la prueba de calidad (el más
 * liviano que no se nota). PNG prueba primero sin pérdida y luego con paleta; un WebP que no admite recompresión con pérdida se prueba sin pérdida.
 */
const RUNGS: Record<ImageType, Rung[]> = {
  // `effort` en sharp activa la paleta de 256 colores (con pérdida): el intento sin pérdida no lo lleva.
  "image/png": [
    { label: "PNG sin pérdida", encode: (s) => s.png({ compressionLevel: 9, adaptiveFiltering: true }) },
    { label: "PNG paleta 256 colores", encode: (s) => s.png({ compressionLevel: 9, palette: true, quality: 90, effort: 10, dither: 1 }) },
  ],
  "image/jpeg": [jpeg(78), jpeg(84), jpeg(90)],
  "image/webp": [webp(80), webp(88), webp(94), { label: "WebP sin pérdida", encode: (s) => s.webp({ lossless: true, effort: 6 }) }],
  "image/avif": [avif(50), avif(60), avif(70)],
  "image/gif": [{ label: "GIF optimizado", encode: (s) => s.gif({ effort: 10 }) }],
};

/** Recomprime una imagen en su mismo formato sin redimensionarla; `null` si ningún ajuste pasa la prueba de calidad Y pesa menos de `maxBytes`. */
export async function compressImage(data: Buffer, type: ImageType, minPsnr: number, maxBytes: number): Promise<Outcome | null> {
  for (const rung of RUNGS[type]) {
    const candidate = await rung.encode((await openImage(data)).keepIccProfile()).toBuffer();
    if (candidate.length > maxBytes) continue;
    const psnr = await psnrBetween(data, candidate);
    if (psnr >= minPsnr) return { data: candidate, step: rung.label, psnr };
  }
  return null;
}
