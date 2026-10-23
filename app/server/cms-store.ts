import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Manifest } from "../components/external-site/types";

/** Lo publicado, un manifiesto por sitio. Sin base de datos todavía: un archivo local (ver .gitignore). */
const FILE = join(process.cwd(), ".cms-data", "manifests.json");

type Store = Record<string, Manifest>;

async function readStore(): Promise<Store> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as Store;
  } catch {
    return {};
  }
}

export async function readManifest(site: string): Promise<Manifest | null> {
  return (await readStore())[site] ?? null;
}

export async function writeManifest(manifest: Manifest): Promise<void> {
  const store = await readStore();
  store[manifest.site] = manifest;
  await mkdir(dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(store, null, 2));
}
