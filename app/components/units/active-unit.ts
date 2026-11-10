import type { User } from "../auth/types";

/** `undefined` = no trabaja con unidades; `null` = trabaja en lo global; si no, el id de su unidad. */
export type ActiveUnit = string | null | undefined;

const KEY = "portal:active-unit";

/** La unidad en la que trabaja ahora: la última que eligió si sigue siendo suya, o la primera de las suyas. */
export function pickActiveUnit(user: Pick<User, "units" | "canEditGlobal"> | null | undefined, stored: string | null | undefined): ActiveUnit {
  if (!user?.units) return undefined;
  if (stored === "global" && user.canEditGlobal) return null;
  if (stored && user.units.some((unit) => unit.id === stored)) return stored;
  return user.units[0]?.id ?? (user.canEditGlobal ? null : undefined);
}

/** Lo recordado en este navegador (puede fallar con datos bloqueados: entonces no se recuerda nada). */
export function readStoredUnit(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function storeUnit(unitId: string | null): void {
  try {
    window.localStorage.setItem(KEY, unitId ?? "global");
  } catch {
    // sin almacenamiento no se recuerda: la próxima vez se usa la primera unidad
  }
}
