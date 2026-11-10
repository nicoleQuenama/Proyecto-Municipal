import type { Actor } from "../auth-accounts";
import { isPgError, type Tx } from "../db";
import type { Scope } from "../site/site-sql";
import { VersionError } from "../versions/branch-rows";
import type { UnitKind } from "./types";
import type { UnitInput, UnitOverride } from "./unit-input";

export interface Unit {
  id: string;
  name: string;
  kind: UnitKind;
  ownerId: string | null;
  reviewRequired: boolean;
  memberIds: string[];
  overrides: UnitOverride[];
}

/** Las unidades las administra el superadministrador (la base de datos lo exige también: este es el mensaje claro). */
export function assertSuperadmin(actor: Actor): void {
  if (actor.user.role !== "superadmin") throw new VersionError("Solo el superadministrador administra las unidades.", 403);
}

/** Traduce los errores que la persona puede provocar (nombre repetido, personas que no existen) a un mensaje claro. */
async function friendly<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (isPgError(error, "23505")) throw new VersionError("Ya hay una unidad con ese nombre.", 409);
    if (isPgError(error, "23503")) throw new VersionError("Alguna de las personas indicadas no existe en esta organización.", 400);
    throw error;
  }
}

export async function listUnits(tx: Tx, scope: Scope): Promise<{ units: Unit[]; globalEditorIds: string[] }> {
  const rows = await tx.unsafe(
    `select u.id, u.name::text as name, u.kind, u.owner_id as "ownerId", u.review_required as "reviewRequired",
            coalesce((select array_agg(m.user_id order by m.user_id) from app.unit_members m where m.organization_id = u.organization_id and m.unit_id = u.id), '{}') as "memberIds",
            coalesce((select json_agg(json_build_object('permission', o.permission, 'allowed', o.allowed) order by o.permission) from app.unit_permission_overrides o where o.organization_id = u.organization_id and o.unit_id = u.id), '[]'::json) as overrides
     from app.units u where u.organization_id = $1 and u.deleted_at is null order by u.name`,
    [scope.org],
  );
  const editors = await tx.unsafe(`select id from app.users where organization_id = $1 and can_edit_global and deleted_at is null`, [scope.org]);
  return { units: rows as unknown as Unit[], globalEditorIds: editors.map((row) => row.id as string) };
}

async function writeOverrides(tx: Tx, scope: Scope, unitId: string, overrides: readonly UnitOverride[]): Promise<void> {
  await tx.unsafe(`delete from app.unit_permission_overrides where organization_id = $1 and unit_id = $2`, [scope.org, unitId]);
  for (const { permission, allowed } of overrides) {
    await tx.unsafe(`insert into app.unit_permission_overrides (organization_id, unit_id, permission, allowed) values ($1, $2, $3, $4)`, [scope.org, unitId, permission, allowed]);
  }
}

export const createUnit = (tx: Tx, scope: Scope, input: UnitInput): Promise<string> =>
  friendly(async () => {
    const [row] = await tx.unsafe(`insert into app.units (organization_id, name, kind, owner_id, review_required) values ($1, $2, $3, $4, $5) returning id`, [scope.org, input.name, input.kind, input.ownerId, input.reviewRequired]);
    await writeOverrides(tx, scope, row.id as string, input.overrides);
    return row.id as string;
  });

export const updateUnit = (tx: Tx, scope: Scope, id: string, input: UnitInput): Promise<void> =>
  friendly(async () => {
    const updated = await tx.unsafe(`update app.units set name = $3, kind = $4, owner_id = $5, review_required = $6 where organization_id = $1 and id = $2 and deleted_at is null returning id`, [scope.org, id, input.name, input.kind, input.ownerId, input.reviewRequired]);
    if (updated.length === 0) throw new VersionError("La unidad no existe.", 404);
    await writeOverrides(tx, scope, id, input.overrides);
  });

/** Borra (sin perder el historial) una unidad vacía; con páginas o archivos la base de datos lo rechaza (409). */
export async function deleteUnit(tx: Tx, scope: Scope, id: string): Promise<void> {
  const done = await tx.unsafe(`update app.units set deleted_at = now() where organization_id = $1 and id = $2 and deleted_at is null returning id`, [scope.org, id]);
  if (done.length === 0) throw new VersionError("La unidad no existe.", 404);
  await tx.unsafe(`delete from app.unit_members where organization_id = $1 and unit_id = $2`, [scope.org, id]);
}

/**
 * Reemplaza quiénes están en la unidad. Quien entra y aún no es miembro del proyecto lo pasa a ser (como editor) para que pueda ver
 * el sitio: el superadministrador no tiene que hacer dos pasos.
 */
export const setMembers = (tx: Tx, scope: Scope, unitId: string, userIds: readonly string[]): Promise<void> =>
  friendly(async () => {
    const [unit] = await tx.unsafe(`select id from app.units where organization_id = $1 and id = $2 and deleted_at is null`, [scope.org, unitId]);
    if (!unit) throw new VersionError("La unidad no existe.", 404);
    await tx.unsafe(`delete from app.unit_members where organization_id = $1 and unit_id = $2 and not (user_id = any ($3::uuid[]))`, [scope.org, unitId, [...userIds]]);
    await tx.unsafe(`insert into app.unit_members (organization_id, unit_id, user_id) select $1, $2, u from unnest($3::uuid[]) u on conflict do nothing`, [scope.org, unitId, [...userIds]]);
    await tx.unsafe(
      `insert into app.project_members (organization_id, project_id, user_id, member_role)
       select $1, $2, u, 'editor' from unnest($3::uuid[]) u on conflict do nothing`,
      [scope.org, scope.project, [...userIds]],
    );
  });

/** Reemplaza quiénes pueden editar lo global (el superadministrador siempre puede, no hace falta marcarlo). */
export async function setGlobalEditors(tx: Tx, scope: Scope, userIds: readonly string[]): Promise<void> {
  await tx.unsafe(
    `update app.users set can_edit_global = (id = any ($2::uuid[]))
     where organization_id = $1 and deleted_at is null and role <> 'superadmin' and can_edit_global is distinct from (id = any ($2::uuid[]))`,
    [scope.org, [...userIds]],
  );
}
