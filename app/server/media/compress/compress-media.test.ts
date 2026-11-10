import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { compressMedia } from "./compress-media";
import { LOSSLESS_PSNR, psnrBetween } from "./psnr";

/** Una imagen con degradados y un poco de ruido: parecida a una foto, determinista. */
async function sample(): Promise<{ width: number; height: number; raw: Buffer }> {
  const width = 400;
  const height = 300;
  const raw = Buffer.alloc(width * height * 3);
  let seed = 7;
  for (let i = 0; i < raw.length; i += 1) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const x = (i / 3) % width;
    raw[i] = Math.min(255, Math.floor(x / 2 + (i % 3) * 30 + (seed % 9)));
  }
  return { width, height, raw };
}

describe("compressMedia", () => {
  it("un PNG sin optimizar se recomprime sin perder nada", async () => {
    const { width, height, raw } = await sample();
    const png = await sharp(raw, { raw: { width, height, channels: 3 } }).png({ compressionLevel: 0 }).toBuffer();
    const { data, report } = await compressMedia(png, "image/png");
    expect(report.applied).toBe(true);
    expect(data.length).toBeLessThan(png.length);
    expect(await psnrBetween(png, data)).toBe(LOSSLESS_PSNR);
  });

  it("un JPEG de calidad muy alta baja de peso y se mantiene sobre 40 dB", async () => {
    const { width, height, raw } = await sample();
    const jpeg = await sharp(raw, { raw: { width, height, channels: 3 } }).jpeg({ quality: 100, chromaSubsampling: "4:4:4" }).toBuffer();
    const { data, report } = await compressMedia(jpeg, "image/jpeg");
    expect(report.applied).toBe(true);
    expect(report.psnr).toBeGreaterThanOrEqual(40);
    expect(data.length).toBeLessThan(jpeg.length * 0.97);
  });

  it("deja el original intacto si lo comprimido no se ahorra o falla", async () => {
    const garbage = Buffer.from("esto no es una imagen");
    const { data, report } = await compressMedia(garbage, "image/webp");
    expect(data).toBe(garbage);
    expect(report).toMatchObject({ applied: false, savedPercent: 0, finalBytes: garbage.length });
    expect(report.reason).toBeTruthy();
  });

  it("el PSNR de dos imágenes distintas es bajo y el de dos iguales es el máximo", async () => {
    const { width, height, raw } = await sample();
    const a = await sharp(raw, { raw: { width, height, channels: 3 } }).png().toBuffer();
    const b = await sharp(raw, { raw: { width, height, channels: 3 } }).negate().png().toBuffer();
    expect(await psnrBetween(a, a)).toBe(LOSSLESS_PSNR);
    expect(await psnrBetween(a, b)).toBeLessThan(20);
  });
});
