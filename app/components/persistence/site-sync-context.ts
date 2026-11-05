"use client";

import { createContext, useContext } from "react";
import type { SiteSync } from "./use-site-sync";

/** Lo que el sitio sabe de su sincronización con el servidor: la versión de partida y cómo forzar un guardado. */
export const SiteSyncContext = createContext<SiteSync | null>(null);

export function useSiteSyncState(): SiteSync {
  const sync = useContext(SiteSyncContext);
  if (!sync) throw new Error("Debe usarse dentro de <SiteProvider>");
  return sync;
}
