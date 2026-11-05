import { createHash } from "node:crypto";
import { db } from "./db";

/** Una respuesta guardada en el servidor con el momento en que llegó. */
export interface CachedResponse {
  at: number;
  status: number;
  contentType: string;
  body: string;
}

export type ServerCachePolicy = { kind: "none" } | { kind: "ttl"; seconds: number } | { kind: "persistent" };

export const cacheKey = (parts: unknown): string => createHash("sha256").update(JSON.stringify(parts)).digest("hex");

/**
 * La caché vive en la base de datos (`data_source_cache`), compartida entre visitantes y servidores. El proxy atiende también
 * a visitantes sin sesión, así que se entra por funciones acotadas a la organización que este servidor atiende.
 * Sin organización configurada no hay caché (se pide de nuevo cada vez).
 */
const org = () => process.env.PORTAL_ORG_SLUG ?? null;

export async function readCache(key: string, policy: ServerCachePolicy): Promise<CachedResponse | null> {
  const slug = org();
  if (policy.kind === "none" || !slug) return null;
  const [row] = (await db()`select status, content_type, body, fetched_at from app.cache_get(${slug}, ${Buffer.from(key, "hex")})`) as unknown as { status: number; content_type: string; body: string; fetched_at: Date }[];
  return row ? { at: row.fetched_at.getTime(), status: row.status, contentType: row.content_type, body: row.body } : null;
}

export async function writeCache(key: string, policy: ServerCachePolicy, entry: CachedResponse): Promise<void> {
  const slug = org();
  if (policy.kind === "none" || !slug) return;
  const ttl = policy.kind === "ttl" ? Math.max(1, Math.round(policy.seconds)) : null;
  await db()`select app.cache_put(${slug}, ${Buffer.from(key, "hex")}, ${entry.status}, ${entry.contentType}, ${entry.body}, ${ttl})`.catch(() => undefined);
}
