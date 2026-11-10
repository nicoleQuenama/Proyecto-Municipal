"use client";

import { useCallback, useEffect, useState } from "react";
import { REQUEST_HEADER } from "../../server/request-header";
import type { Unit } from "../../server/units/unit-store";
import { forgetUnitNames } from "./use-unit-names";

export interface UnitDraft {
  name: string;
  kind: "designer" | "dev";
  ownerId: string | null;
  reviewRequired: boolean;
  overrides: { permission: string; allowed: boolean }[];
}

async function call(url: string, method: string, body?: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const response = await fetch(url, { method, headers: { [REQUEST_HEADER]: "1", "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) }).catch(() => null);
  const data = ((await response?.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
  return { ok: !!response?.ok, data: response ? data : { error: "Sin conexión." } };
}

/** Las unidades de la organización y lo que el superadministrador puede hacer con ellas. Cada acción vuelve a leer la lista. */
export function useUnitsAdmin() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [globalEditorIds, setGlobalEditorIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { ok, data } = await call("/api/cms/units", "GET");
    if (ok) {
      setUnits((data.units as Unit[]) ?? []);
      setGlobalEditorIds((data.globalEditorIds as string[]) ?? []);
    }
  }, []);
  // Se lee al abrir el panel (la respuesta llega después, no dentro del efecto).
  useEffect(() => {
    let alive = true;
    void call("/api/cms/units", "GET").then(({ ok, data }) => {
      if (!alive || !ok) return;
      setUnits((data.units as Unit[]) ?? []);
      setGlobalEditorIds((data.globalEditorIds as string[]) ?? []);
    });
    return () => {
      alive = false;
    };
  }, []);

  /** Ejecuta una acción y, pase lo que pase, deja la pantalla con lo que hay de verdad en el servidor. */
  const run = useCallback(
    async (url: string, method: string, body?: unknown) => {
      const { ok, data } = await call(url, method, body);
      setError(ok ? null : String(data.error ?? "No se pudo completar la acción."));
      forgetUnitNames();
      await load();
      return ok;
    },
    [load],
  );

  return {
    units,
    globalEditorIds,
    error,
    create: (draft: UnitDraft) => run("/api/cms/units", "POST", draft),
    update: (id: string, draft: UnitDraft) => run(`/api/cms/units/${id}`, "PATCH", draft),
    remove: (id: string) => run(`/api/cms/units/${id}`, "DELETE"),
    setMembers: (id: string, userIds: string[]) => run(`/api/cms/units/${id}/members`, "PUT", { userIds }),
    setGlobalEditors: (userIds: string[]) => run("/api/cms/units/global-editors", "PUT", { userIds }),
  };
}
