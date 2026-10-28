import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { strToU8, zipSync } from "fflate";
import { extraFiles, type BundleKind } from "./bundle-files";
import { readPart } from "./project-store";
import { readPublished } from "./published-store";

const ROOT = process.cwd();
/** Del código se llevan estas carpetas y archivos de la raíz; node_modules, .next y los datos privados se quedan. */
const INCLUDE_DIRS = ["app", "public"];
const INCLUDE_FILES = ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "tsconfig.json", "next.config.ts", "next.config.mjs", "next.config.js", "postcss.config.mjs", "eslint.config.mjs"];
const SKIP = new Set(["node_modules", ".next", ".git", ".cms-data"]);
const MAX_FILE_BYTES = 2_000_000;

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path, out);
    else out.push(path);
  }
  return out;
}

const exists = (path: string) => stat(path).then(() => true, () => false);

/** Los archivos del paquete: el código, el sitio publicado (o el diseño guardado, si no se publicó) y los de Docker si se piden. */
export async function collectBundle(kind: BundleKind): Promise<Record<string, Uint8Array>> {
  const files: Record<string, Uint8Array> = {};

  const paths = (await Promise.all(INCLUDE_DIRS.map(async (dir) => ((await exists(join(ROOT, dir))) ? walk(join(ROOT, dir)) : [])))).flat();
  for (const name of INCLUDE_FILES) if (await exists(join(ROOT, name))) paths.push(join(ROOT, name));
  for (const path of paths) {
    if ((await stat(path)).size > MAX_FILE_BYTES) continue;
    files[relative(ROOT, path).split(sep).join("/")] = new Uint8Array(await readFile(path));
  }

  const published = await readPublished();
  const site = published ?? (await readPart("site"));
  if (site) files[".cms-data/published-site.json"] = strToU8(site);
  for (const [name, content] of Object.entries(extraFiles(kind, published !== null))) files[name] = strToU8(content);

  return files;
}

export async function buildBundle(kind: BundleKind): Promise<Uint8Array> {
  return zipSync(await collectBundle(kind), { level: 6 });
}
