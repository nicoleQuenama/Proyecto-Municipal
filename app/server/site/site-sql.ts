import type { TransactionSql } from "postgres";
import type { Column, TableDef } from "./site-tables.ts";

export type Tx = TransactionSql;

/** En qué organización y proyecto se trabaja. Nada de este módulo lee otra cosa que lo que describe `site-tables.ts`. */
export interface Scope {
  org: string;
  project: string;
}

const quote = (name: string) => `"${name}"`;
const recordset = (columns: Column[]) => columns.map((column) => `${quote(column.field)} ${column.type}`).join(", ");
const SCOPED = "organization_id = $1 and project_id = $2";

/**
 * Escribe filas con UNA consulta: el JSON de todas viaja como un solo parámetro. Si la fila ya existe solo se actualiza
 * cuando algo cambió de verdad (sin cambios no hay escritura, ni versión nueva, ni gasto de la base de datos).
 * Sin `key` (reglas de estilo) es un `insert` simple.
 */
export async function upsertRows(tx: Tx, def: TableDef, scope: Scope, rows: readonly object[]): Promise<void> {
  if (rows.length === 0) return;
  const columns = ["organization_id", "project_id", ...def.columns.map((column) => column.column)].join(", ");
  const values = ["$2::uuid", "$3::uuid", ...def.columns.map((column) => column.expr ?? `r.${quote(column.field)}`)].join(", ");
  const writable = def.columns.filter((column) => column.update !== false && !def.key.includes(column.column));
  const current = writable.map((column) => `app.${def.table}.${column.column}`).join(", ");
  const incoming = writable.map((column) => `excluded.${column.column}`).join(", ");
  const onConflict =
    def.key.length === 0
      ? ""
      : `on conflict (organization_id, project_id, ${def.key.join(", ")}) do update set ${writable.map((column) => `${column.column} = excluded.${column.column}`).join(", ")} where (${current}) is distinct from (${incoming})`;

  await tx.unsafe(`insert into app.${def.table} (${columns}) select ${values} from jsonb_to_recordset($1::jsonb) as r(${recordset(def.columns)}) ${onConflict}`, [rows as never, scope.org, scope.project]);
}

/** Borra por id lo que la persona eliminó a propósito. */
export async function deleteIds(tx: Tx, table: string, scope: Scope, ids: readonly string[]): Promise<void> {
  if (ids.length > 0) await tx.unsafe(`delete from app.${table} where ${SCOPED} and id = any($3::text[])`, [scope.org, scope.project, [...ids]]);
}

/**
 * Dentro de las páginas (o animaciones) indicadas, borra lo que ya no viene: esas filas viajan completas con su padre,
 * así que lo que falta es lo que la persona quitó de ahí.
 */
export async function deleteStale(tx: Tx, def: TableDef, scope: Scope, parent: { column: string; ids: readonly string[] }, keep: readonly object[]): Promise<void> {
  if (parent.ids.length === 0) return;
  const keys = def.key.map((key) => def.columns.find((column) => column.column === key)!);
  const same = keys.map((key) => `r.${quote(key.field)} = t.${key.column}`).join(" and ");
  await tx.unsafe(
    `delete from app.${def.table} t where t.organization_id = $1 and t.project_id = $2 and t.${parent.column} = any($3::text[])
       and not exists (select 1 from jsonb_to_recordset($4::jsonb) as r(${recordset(keys)}) where ${same})`,
    [scope.org, scope.project, [...parent.ids], keep as never],
  );
}

/** Reemplaza una lista entera (variables y reglas de estilo: pequeñas y sin identidad estable). */
export async function deleteAll(tx: Tx, table: string, scope: Scope): Promise<void> {
  await tx.unsafe(`delete from app.${table} where ${SCOPED}`, [scope.org, scope.project]);
}

/**
 * Pone el orden de una lista. Lo que la persona listó queda en ese orden; lo que no vio (una página que otra persona
 * añadió mientras tanto) se queda detrás, en su orden anterior. Se renumera sin huecos, así dos personas que añaden a la
 * vez no se pisan ni chocan: las dos cosas se conservan.
 */
export async function applyOrder(tx: Tx, table: string, scope: Scope, ids: readonly string[]): Promise<void> {
  if (ids.length === 0) return;
  await tx.unsafe(
    `with wanted as (select id, ord from unnest($3::text[]) with ordinality as o(id, ord)),
          ranked as (
            select t.id, row_number() over (order by coalesce(w.ord, 1000000000 + t.position), t.position, t.id) - 1 as pos
            from app.${table} t left join wanted w on w.id = t.id
            where t.organization_id = $1 and t.project_id = $2)
     update app.${table} t set position = ranked.pos from ranked
     where t.organization_id = $1 and t.project_id = $2 and t.id = ranked.id and t.position is distinct from ranked.pos`,
    [scope.org, scope.project, [...ids]],
  );
}

export async function readRows<T>(tx: Tx, def: TableDef, scope: Scope, orderBy: string): Promise<T[]> {
  const selected = def.columns.map((column) => `${column.column} as ${quote(column.field)}`).join(", ");
  const extra = def.readExtra ? `, ${def.readExtra}` : "";
  return (await tx.unsafe(`select ${selected}${extra} from app.${def.table} where ${SCOPED} order by ${orderBy}`, [scope.org, scope.project])) as unknown as T[];
}
