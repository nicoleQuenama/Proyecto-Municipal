/**
 * Quién recibe a revisión un cambio, sin que la persona tenga que elegir: si solo toca páginas de UNA unidad, su dueño; en cualquier
 * otro caso (varias unidades, lo global, una unidad sin dueño o ser uno mismo el dueño), un superadministrador (`null`).
 */
export function pickReviewer(input: { authorId: string; changedPageUnitIds: readonly (string | null)[]; owners: ReadonlyMap<string, string | null> }): string | null {
  const units = new Set(input.changedPageUnitIds);
  if (units.size !== 1) return null;
  const [unit] = [...units];
  const owner = unit ? input.owners.get(unit) : null;
  return owner && owner !== input.authorId ? owner : null;
}
