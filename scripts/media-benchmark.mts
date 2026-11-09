/**
 * Mide la compresión por formato con archivos reales (los mismos pasos que la subida):
 *   pnpm exec tsx scripts/media-benchmark.mts <carpeta con imágenes y videos>
 * Imprime por archivo cuánto pesaba, cuánto pesa, el ajuste elegido y el PSNR, y al final el ahorro base por formato.
 * No sube ni cambia nada: lee los archivos de la carpeta y trabaja en memoria.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { compressMedia } from "../app/server/media/compress/compress-media";
import type { CompressionReport } from "../app/server/media/compress/types";
import { sniffMediaType } from "../app/server/media/sniff";

const folder = process.argv[2];
if (!folder) {
  console.error("Uso: pnpm exec tsx scripts/media-benchmark.mts <carpeta>");
  process.exit(1);
}

const kb = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`.padStart(9);
const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? 0;

const byType = new Map<string, CompressionReport[]>();
for (const name of (await readdir(folder)).sort()) {
  const data = await readFile(join(folder, name));
  const type = sniffMediaType(data);
  if (!type) continue;
  const { report } = await compressMedia(data, type);
  byType.set(type, [...(byType.get(type) ?? []), report]);
  const outcome = report.applied ? `${report.step}, ${report.psnr} dB` : `se deja igual (${report.reason})`;
  console.log(`${name.padEnd(34)} ${type.padEnd(11)} ${kb(report.originalBytes)} → ${kb(report.finalBytes)}  ${`${report.savedPercent} %`.padStart(7)}  ${(report.ms / 1000).toFixed(1).padStart(6)} s  ${outcome}`);
}

console.log("\nAhorro base por formato (sobre el peso total de las muestras)");
for (const [type, reports] of byType) {
  const before = reports.reduce((sum, r) => sum + r.originalBytes, 0);
  const after = reports.reduce((sum, r) => sum + r.finalBytes, 0);
  const applied = reports.filter((r) => r.applied).length;
  console.log(`${type.padEnd(11)} ${String(reports.length).padStart(2)} archivos · total ${(((before - after) / before) * 100).toFixed(1).padStart(5)} % · mediana ${median(reports.map((r) => r.savedPercent)).toFixed(1).padStart(5)} % · se comprimieron ${applied}/${reports.length}`);
}
