import type { Tx } from "../db";
import type { UnitAccess } from "./types";

/** Las unidades de quien hace la petición, según la base de datos (la misma fuente que decide los permisos). */
export async function unitsOf(tx: Tx): Promise<UnitAccess> {
  const [row] = await tx.unsafe(`select app.unit_scoped() as scoped, app.user_unit_ids() as ids, app.can_edit_global() as global`);
  return row.scoped === true ? { scoped: true, unitIds: row.ids as string[], canEditGlobal: row.global === true } : { scoped: false };
}

/** ¿Es de una unidad de la persona? (`null` = global: de nadie en particular.) */
export const ownsUnit = (access: Extract<UnitAccess, { scoped: true }>, unitId: string | null | undefined): boolean => !!unitId && access.unitIds.includes(unitId);

/** ¿Lo ve? Lo global y lo de sus unidades. */
export const seesUnit = (access: Extract<UnitAccess, { scoped: true }>, unitId: string | null | undefined): boolean => !unitId || access.unitIds.includes(unitId);
