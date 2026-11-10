import type { Tx } from "../db";
import type { UnitRef } from "./types";

export interface UnitProfile {
  units: UnitRef[];
  canEditGlobal: boolean;
  canDeploy: boolean;
}

/**
 * Lo que el editor necesita saber de quien está sujeto a unidades: cuáles son las suyas, si puede editar lo global y si puede
 * desplegar (la base de datos ya lo calcula con el techo de sus unidades y sus vetos). `null` si no está sujeto a unidades.
 */
export async function loadUnitProfile(tx: Tx): Promise<UnitProfile | null> {
  const [row] = await tx.unsafe(`
    select app.unit_scoped() as scoped, app.can_edit_global() as global,
           (select coalesce(json_agg(json_build_object('id', u.id, 'name', u.name::text) order by u.name), '[]'::json) from app.units u where u.id = any (app.user_unit_ids())) as units,
           coalesce((select app.has_permission(p.id, 'deploy') from app.projects p where p.deleted_at is null order by p.created_at limit 1), false) as deploy`);
  return row.scoped === true ? { units: row.units as UnitRef[], canEditGlobal: row.global === true, canDeploy: row.deploy === true } : null;
}
