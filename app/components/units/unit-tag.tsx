"use client";

import { useAuth } from "../auth/auth-context";
import type { Page } from "../site/types";
import { isPageReadOnly } from "./own-pages";
import { useUnitNames } from "./use-unit-names";
import { getUnitColor } from "./unit-colors";

/** De quién es una página: su unidad, o «Global» (y «solo lectura» si la persona no puede editarla). No dibuja nada sin unidades. */
export function UnitTag({ page }: { page: Page }) {
  const { currentUser } = useAuth();
  const names = useUnitNames();
  if (names.length === 0) return null;

  const label = page.unitId ? (names.find((unit) => unit.id === page.unitId)?.name ?? "Unidad") : "Global";
  const readOnly = isPageReadOnly(currentUser, page);
  const color = getUnitColor(page.unitId);

  return (
    <span
      title={readOnly ? "Se ve, pero no la puedes editar (pertenece a otra unidad)" : `Página asignada a: ${label}`}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition-colors"
      style={{
        borderColor: color.borderLight,
        backgroundColor: color.bg,
        color: color.text,
      }}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color.border }}
      />
      <span className="truncate max-w-[120px]">{label}</span>
      {readOnly && <span className="text-[9px] opacity-75 font-normal">· lectura</span>}
    </span>
  );
}
