"use client";

import { useEffect, useState } from "react";
import { REQUEST_HEADER } from "../../server/request-header";

export interface UnitName {
  id: string;
  name: string;
}

let pending: Promise<UnitName[]> | null = null;

/** Se pide una sola vez por pestaña: son pocos nombres y casi no cambian. */
function fetchNames(): Promise<UnitName[]> {
  pending ??= fetch("/api/cms/units/names", { headers: { [REQUEST_HEADER]: "1" } })
    .then((response) => (response.ok ? response.json() : { units: [] }))
    .then((body: { units?: UnitName[] }) => body.units ?? [])
    .catch(() => []);
  return pending;
}

/** Todas las unidades de la organización (vacío si no usa unidades). */
export function useUnitNames(): UnitName[] {
  const [names, setNames] = useState<UnitName[]>([]);
  useEffect(() => {
    let alive = true;
    void fetchNames().then((units) => alive && setNames(units));
    return () => {
      alive = false;
    };
  }, []);
  return names;
}

/** Para que otra pantalla vuelva a pedirlos (p. ej. tras crear una unidad). */
export const forgetUnitNames = (): void => {
  pending = null;
};
