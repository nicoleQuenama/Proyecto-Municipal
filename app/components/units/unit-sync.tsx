"use client";

import { useEffect } from "react";
import { useAuth, useAuthDispatch } from "../auth/auth-context";
import { useSite, useSiteDispatch } from "../site/site-context";
import { setUploadUnit } from "../media/upload-media";
import { pickActiveUnit, readStoredUnit } from "./active-unit";
import { ownPageIds } from "./own-pages";

const sameIds = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((id) => b.includes(id));

/**
 * Mantiene al día, sin dibujar nada, lo que depende de las unidades de la persona: en qué unidad trabaja (ahí nacen páginas y
 * archivos), a dónde se suben los archivos, y qué páginas puede editar (se usa el alcance que el editor ya sabe respetar).
 */
export function UnitSync() {
  const { currentUser } = useAuth();
  const authDispatch = useAuthDispatch();
  const site = useSite();
  const siteDispatch = useSiteDispatch();

  // La unidad activa vive en la pantalla: al cargar el sitio se pierde, así que se vuelve a poner.
  useEffect(() => {
    if (site.activeUnitId !== undefined) return;
    const active = pickActiveUnit(currentUser, readStoredUnit());
    if (active !== undefined) siteDispatch({ type: "unit/set-active", unitId: active });
  }, [currentUser, site.activeUnitId, siteDispatch]);

  useEffect(() => setUploadUnit(site.activeUnitId), [site.activeUnitId]);

  // Quien trabaja con unidades solo edita sus páginas (y las globales, con permiso): se le da ese alcance.
  useEffect(() => {
    if (!currentUser?.units) return;
    const ids = ownPageIds(site.pages, currentUser);
    if (currentUser.access?.scope && sameIds(ids, currentUser.access.scope.pageIds)) return;
    authDispatch({ type: "auth/login", user: { ...currentUser, access: { scope: { pageIds: ids, blockIds: [] }, denied: currentUser.access?.denied ?? [], expiresAt: currentUser.access?.expiresAt ?? null } } });
  }, [currentUser, site.pages, authDispatch]);

  return null;
}
