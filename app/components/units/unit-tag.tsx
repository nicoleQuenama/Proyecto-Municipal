"use client";

import { useAuth } from "../auth/auth-context";
import type { Page } from "../site/types";
import { isPageReadOnly } from "./own-pages";
import { useUnitNames } from "./use-unit-names";

/** De quién es una página: su unidad, o «Global» (y «solo lectura» si la persona no puede editarla). No dibuja nada sin unidades. */
export function UnitTag({ page }: { page: Page }) {
  const { currentUser } = useAuth();
  const names = useUnitNames();
  if (names.length === 0) return null;

  const label = page.unitId ? (names.find((unit) => unit.id === page.unitId)?.name ?? "Unidad") : "Global";
  const readOnly = isPageReadOnly(currentUser, page);
  return (
    <span
      title={readOnly ? "Se ve, pero no la puedes editar" : undefined}
      className={`shrink-0 rounded px-1.5 py-0.2 text-[9px] font-semibold uppercase ${page.unitId ? "bg-sky-500/15 text-sky-600" : "bg-line text-ink-dim"}`}
    >
      {label}
      {readOnly ? " · solo lectura" : ""}
    </span>
  );
}
