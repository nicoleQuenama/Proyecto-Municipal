/** A qué unidades pertenece alguien, y si es superadministrador de una organización que usa unidades (`all`). */
export interface Audience {
  units: readonly string[];
  all: boolean;
}

/**
 * ¿Le llega al `recipient` lo que hace el `sender`? Solo entre quienes comparten alguna unidad. El superadministrador lo recibe
 * todo, pero nadie recibe lo que él emite (así no se filtra contenido ajeno). Sin unidades en la organización nadie tiene ni
 * `all` ni unidades, y todos se ven, como siempre.
 */
export function shouldDeliver(sender: Audience, recipient: Audience): boolean {
  if (recipient.all) return true;
  if (sender.all) return false;
  if (sender.units.length === 0 && recipient.units.length === 0) return true;
  return sender.units.some((unit) => recipient.units.includes(unit));
}
