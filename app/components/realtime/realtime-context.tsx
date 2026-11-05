"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useSiteSyncState } from "../persistence/site-sync-context";
import { useSite } from "../site/site-context";
import { useBranch } from "../versioning/branch-context";
import type { Peer, ServerMessage } from "./types";
import { useLiveEdits } from "./use-live-edits";
import { usePresence } from "./use-presence";
import { useRealtimeSocket } from "./use-realtime-socket";

interface RealtimeValue {
  connected: boolean;
  /** Las demás personas que están en el proyecto ahora mismo (en cualquier rama). */
  peers: Peer[];
}

const RealtimeContext = createContext<RealtimeValue>({ connected: false, peers: [] });

export const useRealtime = () => useContext(RealtimeContext);

/** Tiempo real del proyecto: quién está en vivo, sus cursores y selecciones, y lo que editan. Va dentro del sitio y del lienzo. */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const site = useSite();
  const sync = useSiteSyncState();
  const branch = useBranch()?.branch ?? null;

  // El socket necesita manejar lo que llega, y lo que llega necesita el socket para enviar: se resuelve con una referencia estable.
  const applyRef = useRef<((message: ServerMessage) => void) | null>(null);
  const handle = useCallback((message: ServerMessage) => applyRef.current?.(message), []);
  const reconnect = useCallback(() => void sync.refresh(), [sync]);
  const { connected, peers, send } = useRealtimeSocket(branch !== null, handle, reconnect);
  const apply = useLiveEdits(site, sync, branch, connected, send);
  useEffect(() => {
    applyRef.current = apply;
  }, [apply]);
  usePresence(site, connected, send);

  const value = useMemo(() => ({ connected, peers }), [connected, peers]);
  return <RealtimeContext value={value}>{children}</RealtimeContext>;
}
