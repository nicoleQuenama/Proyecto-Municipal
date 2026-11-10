"use client";

import { useEffect, useState } from "react";
import { REQUEST_HEADER } from "../../server/request-header";

export interface UnitName {
  id: string;
  name: string;
}

let pending: Promise<UnitName[]> | null = null;
let generation = 0;
const listeners = new Set<() => void>();

/** Se pide una sola vez por pestaña: son pocos nombres y casi no cambian. */
function fetchNames(): Promise<UnitName[]> {
  pending ??= fetch("/api/cms/units/names", { headers: { [REQUEST_HEADER]: "1" } })
    .then((response) => (response.ok ? response.json() : { units: [] }))
    .then((body: { units?: UnitName[] }) => body.units ?? [])
    .catch(() => []);
  return pending;
}

/** Todas las unidades de la organización (vacío si no usa unidades). Se refresca solo cuando cambian. */
export function useUnitNames(): UnitName[] {
  const [names, setNames] = useState<UnitName[]>([]);
  useEffect(() => {
    let alive = true;
    const refresh = () => {
      const at = generation;
      void fetchNames().then((units) => {
        if (alive && at === generation) setNames(units);
      });
    };
    refresh();
    listeners.add(refresh);
    return () => {
      alive = false;
      listeners.delete(refresh);
    };
  }, []);
  return names;
}

/** Para que las pantallas abiertas vuelvan a pedirlos (p. ej. al crear una unidad o cambiar sus miembros). */
export const forgetUnitNames = (): void => {
  pending = null;
  generation += 1;
  for (const listener of listeners) listener();
};
