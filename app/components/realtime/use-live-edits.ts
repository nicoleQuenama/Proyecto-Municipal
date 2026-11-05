"use client";

import { useCallback, useEffect, useRef } from "react";
import { applyPatchToSite } from "../../server/site/site-apply";
import type { SitePatch } from "../../server/site/site-patch";
import { diffSite } from "../persistence/site-diff";
import type { SiteSync } from "../persistence/use-site-sync";
import type { SiteState } from "../site/types";
import type { ClientMessage, ServerMessage } from "./types";

/** Cada cuánto, como mucho, se comparte lo que se está moviendo: lo bastante seguido para verse fluido, sin saturar. */
const SHARE_MS = 80;

/**
 * Lo que se edita se ve en vivo en las pantallas de quienes están en la misma rama: mientras se arrastra una sección, los demás
 * la ven moverse. Esto es solo lo que se ve; guardar sigue siendo cosa de cada quien (con sus permisos). Lo recibido nunca se
 * vuelve a enviar ni a guardar desde aquí.
 */
export function useLiveEdits(state: SiteState, sync: SiteSync, branch: string | null, connected: boolean, send: (message: ClientMessage) => void) {
  /** Lo que los demás ya tienen: lo guardado, más lo que se les ha ido enviando y lo que ellos enviaron. */
  const shared = useRef<SiteState | null>(null);
  const latest = useRef(state);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    latest.current = state;
  });

  // Al abrir una rama (o al volver a conectarse) se avisa en cuál se está y se parte de lo guardado.
  useEffect(() => {
    if (!connected || !branch || !sync.ready) return;
    shared.current = sync.saved();
    send({ type: "join", branch });
  }, [connected, branch, sync, send]);

  useEffect(() => {
    if (!connected || !sync.ready) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const patch = diffSite(shared.current, latest.current);
      if (!patch) return;
      shared.current = latest.current;
      send({ type: "draft", patch });
    }, SHARE_MS);
    return () => clearTimeout(timer.current);
  }, [state, connected, sync.ready, send]);

  /** Lo que llega de otra persona en esta misma rama. */
  return useCallback(
    (message: ServerMessage) => {
      if (message.type !== "draft" || message.branch !== branch) return;
      const patch = message.patch as SitePatch;
      if (shared.current) shared.current = applyPatchToSite(shared.current, patch);
      sync.applyRemote(patch);
    },
    [branch, sync],
  );
}
