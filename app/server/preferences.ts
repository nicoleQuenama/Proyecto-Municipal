import type { Tx } from "./db";

/** Las claves de preferencias: minúsculas, números y `.`, `_`, `-` (lo mismo que verifica la base de datos). */
export const PREFERENCE_KEY = /^[a-z][a-z0-9._-]{0,63}$/;

/** Todas las preferencias de la persona de la sesión (la base de datos solo deja ver las suyas). */
export async function readPreferences(tx: Tx): Promise<Record<string, unknown>> {
  const rows = await tx.unsafe(`select key, value from app.user_preferences`);
  return Object.fromEntries(rows.map((row) => [row.key as string, row.value]));
}

export async function writePreference(tx: Tx, orgId: string, userId: string, key: string, value: unknown): Promise<void> {
  await tx.unsafe(
    `insert into app.user_preferences (organization_id, user_id, key, value) values ($1, $2, $3, $4::jsonb)
     on conflict (organization_id, user_id, key) do update set value = excluded.value, updated_at = now()`,
    [orgId, userId, key, value as never],
  );
}
