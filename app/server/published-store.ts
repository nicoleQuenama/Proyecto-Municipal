import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** El sitio tal como se publicó: lo que ve el público en `/ver` y lo que lleva el paquete exportado. */
const DIR = join(process.cwd(), ".cms-data");
export const PUBLISHED_FILE = join(DIR, "published-site.json");

export async function readPublished(): Promise<string | null> {
  try {
    return await readFile(PUBLISHED_FILE, "utf8");
  } catch {
    return null;
  }
}

export async function writePublished(json: string): Promise<void> {
  await mkdir(DIR, { recursive: true });
  await writeFile(PUBLISHED_FILE, json);
}
