"use client";

import { useEffect, useRef } from "react";
import { useViewport } from "../viewport/viewport-context";
import type { SiteState } from "../site/types";
import type { ClientMessage } from "./types";

const CURSOR_MS = 40;

/** Las secciones que esta persona tiene seleccionadas (o, si ninguna, lo activo). */
const selectionOf = (site: SiteState): string[] => (site.selectedBlockIds?.length ? site.selectedBlockIds : site.selectedId ? [site.selectedId] : []);

/**
 * Cuenta a los demás dónde está esta persona: el cursor sobre la página que mira (en píxeles del diseño, así lo ven igual con
 * otro zoom) y lo que tiene seleccionado.
 */
export function usePresence(site: SiteState, connected: boolean, send: (message: ClientMessage) => void) {
  const { zoom } = useViewport();
  const scale = useRef(zoom / 100);
  useEffect(() => {
    scale.current = zoom / 100;
  }, [zoom]);

  useEffect(() => {
    if (!connected) return;
    let last = 0;
    let visible = false;
    const onMove = (event: PointerEvent) => {
      const now = performance.now();
      if (now - last < CURSOR_MS) return;
      last = now;
      const target = event.target instanceof Element ? event.target : null;
      const frame = target?.closest<HTMLElement>("[data-page-id]");
      const page = frame?.querySelector<HTMLElement>("[data-site-page]");
      if (!frame || !page) {
        if (visible) send({ type: "cursor", page: "", x: Number.NaN, y: Number.NaN });
        visible = false;
        return;
      }
      const rect = page.getBoundingClientRect();
      visible = true;
      send({ type: "cursor", page: frame.dataset.pageId!, x: Math.round((event.clientX - rect.left) / scale.current), y: Math.round((event.clientY - rect.top) / scale.current) });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [connected, send]);

  const ids = selectionOf(site).join("|");
  useEffect(() => {
    if (connected) send({ type: "select", page: site.currentPageId, ids: ids ? ids.split("|") : [] });
  }, [connected, send, site.currentPageId, ids]);
}
