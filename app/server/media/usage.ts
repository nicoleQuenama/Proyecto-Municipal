import type { Tx } from "../db";
import type { Scope } from "../site/site-sql";
import { imagekitConfigured } from "./imagekit";

/** Cuánto almacenamiento de imágenes y videos usa la organización, frente a lo que permite su plan. */
export interface StorageUsage {
  usedBytes: number;
  maxBytes: number;
  files: number;
  /** ¿Está ImageKit configurado en este servidor? Sin él no se pueden subir archivos. */
  configured: boolean;
}

export async function readUsage(tx: Tx, scope: Scope): Promise<StorageUsage> {
  const [row] = await tx.unsafe(
    `select u.storage_bytes::text as used, o.max_storage_bytes::text as max,
            (select count(*)::int from app.assets a where a.organization_id = o.id and a.status = 'ready' and a.deleted_at is null) as files
     from app.organizations o join app.organization_usage u on u.organization_id = o.id where o.id = $1`,
    [scope.org],
  );
  return { usedBytes: Number(row.used), maxBytes: Number(row.max), files: row.files as number, configured: imagekitConfigured() };
}
