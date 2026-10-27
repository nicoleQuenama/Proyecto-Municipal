"use client";

import { sharedUsage } from "../auth/guard-actions";
import { useAuth } from "../auth/auth-context";
import { useCurrentPage, useSite } from "./site-context";
import { TITLE_SELECTION } from "./types";

/**
 * Para quien tiene acceso limitado: del componente de la sección seleccionada, cuántas secciones son suyas y
 * cuántas lo usan en total. `null` si no tiene límite o todas son suyas (entonces «todo el componente» no se recorta).
 */
export function useSharedUsage(): { mine: number; total: number } | null {
  const { currentUser } = useAuth();
  const site = useSite();
  const page = useCurrentPage();
  const block = site.selectedId === TITLE_SELECTION ? undefined : page.blocks.find((b) => b.id === site.selectedId);
  return block ? sharedUsage(currentUser, site.pages, block.componentId) : null;
}

/** Cómo se llama y qué hace «todo el componente» para quien lo ve (sin límite se queda el texto de siempre). */
export function mineLabel(usage: { mine: number; total: number } | null): { label: string; hint: string } | null {
  return usage
    ? { label: `Todas mis secciones (${usage.mine})`, hint: `Cambia solo tus ${usage.mine} secciones con este componente; las otras ${usage.total - usage.mine} no se tocan.` }
    : null;
}
