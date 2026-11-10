/** El tipo de una unidad pone el techo de lo que pueden hacer sus miembros. */
export type UnitKind = "designer" | "dev";

export interface UnitRef {
  id: string;
  name: string;
}

/**
 * Cómo se aplican las unidades a quien hace la petición: `scoped: false` = nada cambia (el superadministrador, o una
 * organización sin unidades); `scoped: true` = solo ve y edita lo de sus unidades, y lo global si tiene permiso.
 */
export type UnitAccess = { scoped: false } | { scoped: true; unitIds: readonly string[]; canEditGlobal: boolean };
