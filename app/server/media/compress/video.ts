import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";
import { LOSSLESS_PSNR } from "./psnr";
import type { Outcome, VideoType } from "./types";

const run = promisify(execFile);
const RUN_TIMEOUT_MS = 180_000;
const TOTAL_BUDGET_MS = 300_000;
/** H.264 y VP9 en 4:2:0 exigen medidas pares. */
const EVEN_SIZE = "scale=trunc(iw/2)*2:trunc(ih/2)*2";

interface Rung {
  label: string;
  args: string[];
}

const h264 = (crf: number): Rung => ({ label: `H.264 crf ${crf}`, args: ["-c:v", "libx264", "-preset", "medium", "-crf", `${crf}`, "-pix_fmt", "yuv420p", "-movflags", "+faststart"] });
const vp9 = (crf: number): Rung => ({ label: `VP9 crf ${crf}`, args: ["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", `${crf}`, "-row-mt", "1", "-deadline", "good", "-cpu-used", "4"] });

/** Igual que en las imágenes: de menos a más calidad, se usa el primero que pasa la prueba. */
const RUNGS: Record<VideoType, { extension: string; rungs: Rung[] }> = {
  "video/mp4": { extension: "mp4", rungs: [h264(24), h264(21), h264(18)] },
  "video/webm": { extension: "webm", rungs: [vp9(36), vp9(32), vp9(28)] },
};

const ffmpeg = (args: string[]) => run(ffmpegPath!, ["-hide_banner", "-y", ...args], { timeout: RUN_TIMEOUT_MS, maxBuffer: 16 * 1024 * 1024 });

/** PSNR promedio entre el video comprimido y el original, medido por el propio FFmpeg. */
async function videoPsnr(candidate: string, original: string): Promise<number> {
  const graph = `[0:v]${EVEN_SIZE}[a];[1:v]${EVEN_SIZE}[b];[a][b]psnr`;
  const { stderr } = await ffmpeg(["-i", candidate, "-i", original, "-lavfi", graph, "-f", "null", "-"]);
  const average = /average:(inf|[\d.]+)/.exec(stderr)?.[1];
  return average === undefined ? 0 : average === "inf" ? LOSSLESS_PSNR : Math.min(Number(average), LOSSLESS_PSNR);
}

/** Recomprime un video en su mismo formato (el audio se copia tal cual); `null` si ningún ajuste pasa la prueba Y pesa menos de `maxBytes`, o si FFmpeg falla. */
export async function compressVideo(data: Buffer, type: VideoType, minPsnr: number, maxBytes: number): Promise<Outcome | null> {
  if (!ffmpegPath) return null;
  const { extension, rungs } = RUNGS[type];
  const dir = await mkdtemp(join(tmpdir(), "portal-video-"));
  const source = join(dir, `source.${extension}`);
  const output = join(dir, `output.${extension}`);
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  try {
    await writeFile(source, data);
    for (const rung of rungs) {
      if (Date.now() > deadline) return null;
      await ffmpeg(["-i", source, "-vf", EVEN_SIZE, "-map", "0:v:0", "-map", "0:a:0?", "-c:a", "copy", "-map_metadata", "-1", ...rung.args, output]);
      const encoded = await readFile(output);
      if (encoded.length > maxBytes) continue;
      const psnr = await videoPsnr(output, source);
      if (psnr >= minPsnr) return { data: encoded, step: rung.label, psnr };
    }
    return null;
  } catch {
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
