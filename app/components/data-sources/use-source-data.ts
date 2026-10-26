"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { usePageParams } from "../dynamic/params-context";
import { load, peek, subscribe } from "./source-store";
import type { DataSource, SourceState } from "./types";

const SERVER_STATE: SourceState = { status: "idle" };

/**
 * El estado de una fuente (y la pide si hace falta). `auto` = false deja la petición al botón «Probar».
 * Si la URL usa `{param:id}`, se pide con los parámetros de la página en pantalla.
 */
export function useSourceData(source: DataSource | undefined, auto = true) {
  const params = usePageParams();
  const state = useSyncExternalStore(
    subscribe,
    () => (source ? peek(source, params) : SERVER_STATE),
    () => SERVER_STATE,
  );

  useEffect(() => {
    if (source && auto) load(source, false, params);
  }, [source, auto, params]);

  const reload = useCallback(() => source && load(source, true, params), [source, params]);
  return { state, reload };
}
