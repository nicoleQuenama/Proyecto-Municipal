"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { load, peek, subscribe } from "./source-store";
import type { DataSource, SourceState } from "./types";

const SERVER_STATE: SourceState = { status: "idle" };

/** El estado de una fuente (y la pide si hace falta). `auto` = false deja la petición al botón «Probar». */
export function useSourceData(source: DataSource | undefined, auto = true) {
  const state = useSyncExternalStore(
    subscribe,
    () => (source ? peek(source) : SERVER_STATE),
    () => SERVER_STATE,
  );

  useEffect(() => {
    if (source && auto) load(source);
  }, [source, auto]);

  const reload = useCallback(() => source && load(source, true), [source]);
  return { state, reload };
}
