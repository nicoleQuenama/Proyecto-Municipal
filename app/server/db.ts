import postgres, { type Sql, type TransactionSql } from "postgres";

export type Tx = TransactionSql;

/** Un solo grupo de conexiones por proceso, aunque Next recargue los módulos en desarrollo. */
const shared = globalThis as unknown as { portalDb?: Sql };

function connect(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL: la base de datos del portal no está configurada (ver .env.example).");
  // prepare: false → compatible con PgBouncer en modo transacción.
  return postgres(url, { max: 10, idle_timeout: 20, prepare: false, onnotice: () => undefined });
}

export const db = (): Sql => (shared.portalDb ??= connect());

/**
 * Corre `work` en una transacción situada en una organización y en una persona. La base de datos aplica el aislamiento
 * (RLS) y los permisos con esos dos datos; `set_config(..., true)` muere con la transacción, así que no se filtra entre
 * peticiones aunque la conexión se reutilice. Sin `userId` solo se pueden usar las tablas de la organización
 * (por ejemplo, emitir un enlace de restablecimiento).
 */
export async function withOrg<T>(orgId: string, userId: string | null, work: (tx: Tx) => Promise<T>): Promise<T> {
  const result = await db().begin(async (tx) => {
    await tx`select set_config('app.org_id', ${orgId}, true), set_config('app.user_id', ${userId ?? ""}, true)`;
    return work(tx);
  });
  return result as T;
}

/** ¿Es un error de Postgres con ese código SQLSTATE (y, si se indica, de esa restricción)? */
export function isPgError(error: unknown, code: string, constraint?: string): boolean {
  const e = error as { code?: string; constraint_name?: string } | null;
  return e?.code === code && (constraint === undefined || e.constraint_name === constraint);
}
