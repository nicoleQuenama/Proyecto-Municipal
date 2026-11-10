import type { User } from "../auth/types";
import type { Page } from "../site/types";

type UnitUser = Pick<User, "units" | "canEditGlobal">;

/** Las páginas que esta persona puede editar: las de sus unidades y, con permiso global, las globales. */
export function ownPageIds(pages: readonly Page[], user: UnitUser): string[] {
  const mine = new Set((user.units ?? []).map((unit) => unit.id));
  return pages.filter((page) => (page.unitId ? mine.has(page.unitId) : user.canEditGlobal === true)).map((page) => page.id);
}

/** ¿Se ve pero no se edita? Solo para quien está sujeto a unidades (`units` definido); el resto no cambia. */
export const isPageReadOnly = (user: UnitUser | null | undefined, page: Page): boolean => user?.units !== undefined && ownPageIds([page], user).length === 0;
