import sharp, { type Sharp } from "sharp";

/** Valor que se da a «idéntico» (el PSNR real sería infinito). */
export const LOSSLESS_PSNR = 100;

/** Abre una imagen ya enderezada según su orientación EXIF (las animadas se leen cuadro a cuadro, sin enderezar). */
export async function openImage(data: Buffer): Promise<Sharp> {
  const { pages } = await sharp(data).metadata();
  return (pages ?? 1) > 1 ? sharp(data, { animated: true }) : sharp(data).rotate();
}

async function pixels(data: Buffer) {
  const { data: raw, info } = await (await openImage(data)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { raw, width: info.width, height: info.height };
}

/**
 * Cuánto se parece el candidato al original, en dB (PSNR sobre los píxeles ya decodificados; en la práctica, 40 dB o más no se
 * distingue a simple vista). Si cambian las medidas o el número de cuadros devuelve 0. Los píxeles totalmente transparentes
 * en los dos no cuentan: su color no se ve.
 */
export async function psnrBetween(original: Buffer, candidate: Buffer): Promise<number> {
  const [a, b] = await Promise.all([pixels(original), pixels(candidate)]);
  if (a.width !== b.width || a.height !== b.height) return 0;
  let squares = 0;
  for (let i = 0; i < a.raw.length; i += 4) {
    const alpha = a.raw[i + 3] - b.raw[i + 3];
    squares += alpha * alpha;
    if (a.raw[i + 3] === 0 && b.raw[i + 3] === 0) continue;
    for (let c = 0; c < 3; c += 1) {
      const diff = a.raw[i + c] - b.raw[i + c];
      squares += diff * diff;
    }
  }
  if (squares === 0) return LOSSLESS_PSNR;
  return Math.min(LOSSLESS_PSNR, 10 * Math.log10((255 * 255) / (squares / a.raw.length)));
}
