"use client";

import { useAuth } from "../auth/auth-context";
import { useSite } from "../site/site-context";
import { pickActiveUnit, readStoredUnit } from "./active-unit";

/**
 * La unidad que manda en el lienzo y en los listados de quien está sujeto a unidades. Es la activa; si todavía no llegó
 * (acaba de cargar), la que tendrá: así no hay un instante en que se vea todo el sitio. `scoped` es falso para el
 * superadministrador y para organizaciones sin unidades, que siguen viendo el sitio entero.
 */
export function useActiveUnit(): { scoped: boolean; unitId: string | null | undefined } {
  const { currentUser } = useAuth();
  const { activeUnitId } = useSite();
  if (currentUser?.units === undefined) return { scoped: false, unitId: undefined };
  return { scoped: true, unitId: activeUnitId !== undefined ? activeUnitId : pickActiveUnit(currentUser, readStoredUnit()) };
}
