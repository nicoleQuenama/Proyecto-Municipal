"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchStatus, type LibsStatus } from "./libs-api";

const UNKNOWN: LibsStatus = { available: false, installed: [] };

/** Si se puede instalar con pnpm y qué librerías instaladas desde la app hay en el proyecto. */
export function useLibsStatus() {
  const [status, setStatus] = useState<LibsStatus>(UNKNOWN);

  const refresh = useCallback(() => {
    fetchStatus().then(setStatus).catch(() => setStatus(UNKNOWN));
  }, []);

  useEffect(refresh, [refresh]);
  return { status, refresh };
}
