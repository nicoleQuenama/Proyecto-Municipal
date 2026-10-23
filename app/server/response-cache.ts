import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/** Una respuesta guardada en el servidor con el momento en que llegó. */
export interface CachedResponse {
  at: number;
  status: number;
  contentType: string;
  body: string;
}

export type ServerCachePolicy = { kind: "none" } | { kind: "ttl"; seconds: number } | { kind: "persistent" };

const DIR = path.join(process.cwd(), ".cache", "data-sources");
const MAX_ENTRIES = 200;
/** Copia en memoria (rápida); la de «persistent» además va a disco para sobrevivir a un reinicio. */
const memory = new Map<string, CachedResponse>();

export const cacheKey = (parts: unknown): string => createHash("sha256").update(JSON.stringify(parts)).digest("hex");

const fileOf = (key: string) => path.join(DIR, `${key}.json`);

export async function readCache(key: string, policy: ServerCachePolicy): Promise<CachedResponse | null> {
  if (policy.kind === "none") return null;

  let entry = memory.get(key) ?? null;
  if (!entry && policy.kind === "persistent") {
    entry = await readFile(fileOf(key), "utf8").then((text) => JSON.parse(text) as CachedResponse, () => null);
    if (entry) memory.set(key, entry);
  }
  if (!entry) return null;
  return policy.kind === "ttl" && Date.now() - entry.at > policy.seconds * 1000 ? null : entry;
}

export async function writeCache(key: string, policy: ServerCachePolicy, entry: CachedResponse): Promise<void> {
  if (policy.kind === "none") return;

  if (memory.size >= MAX_ENTRIES) memory.delete(memory.keys().next().value as string);
  memory.set(key, entry);
  if (policy.kind !== "persistent") return;

  // Sin disco (hosting sin escritura) se queda solo en memoria.
  await mkdir(DIR, { recursive: true }).then(() => writeFile(fileOf(key), JSON.stringify(entry))).catch(() => undefined);
}
