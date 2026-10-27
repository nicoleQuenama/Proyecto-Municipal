import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** Las partes del proyecto que se guardan solas. Una nueva es una entrada nueva. */
export const PROJECT_PARTS = ["site", "versions"] as const;
export type ProjectPart = (typeof PROJECT_PARTS)[number];

const DIR = join(process.cwd(), ".cms-data");
const fileOf = (part: ProjectPart) => join(DIR, `project-${part}.json`);

export const isPart = (value: string | null): value is ProjectPart => PROJECT_PARTS.includes(value as ProjectPart);

export async function readPart(part: ProjectPart): Promise<string | null> {
  try {
    return await readFile(fileOf(part), "utf8");
  } catch {
    return null;
  }
}

/** Cada cuánto como mínimo se guarda una copia de seguridad (ms) y cuántas se conservan por parte. */
const BACKUP_EVERY_MS = 2 * 60_000;
const BACKUPS_KEPT = 30;

/** Guarda una copia de lo que había antes de sobrescribirlo, para poder recuperar el proyecto si algo sale mal. */
async function backUp(part: ProjectPart): Promise<void> {
  const folder = join(DIR, "backups");
  await mkdir(folder, { recursive: true });
  const mine = (await readdir(folder)).filter((name) => name.startsWith(`${part}-`)).sort();
  const newest = mine[mine.length - 1];
  if (newest && Date.now() - (await stat(join(folder, newest))).mtimeMs < BACKUP_EVERY_MS) return;

  await copyFile(fileOf(part), join(folder, `${part}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`));
  await Promise.all(mine.slice(0, Math.max(0, mine.length + 1 - BACKUPS_KEPT)).map((name) => rm(join(folder, name))));
}

export async function writePart(part: ProjectPart, json: string): Promise<void> {
  await mkdir(DIR, { recursive: true });
  await backUp(part).catch(() => {});
  await writeFile(fileOf(part), json);
}
