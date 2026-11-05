"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { REQUEST_HEADER } from "../../server/request-header";
import type { SaveResult } from "../../server/site/site-patch";
import type { SiteState } from "../site/types";
import { applyPatchToSite } from "../../server/site/site-apply";
import type { SitePatch } from "../../server/site/site-patch";
import { diffSite } from "./site-diff";

const SAVE_DELAY_MS = 800;
const HEADERS = { "content-type": "application/json", [REQUEST_HEADER]: "1" };
const urlOf = (branch: string) => `/api/cms/site?branch=${encodeURIComponent(branch)}`;

export interface SiteSync {
  /** El sitio de la última versión guardada de la rama (la referencia para saber qué cambió desde entonces). */
  head: SiteState | null;
  /** Guarda ya lo que esté pendiente y espera a que termine (antes de guardar una versión o de cambiar de rama). */
  flush: () => Promise<void>;
  /** Lo que hay guardado ahora pasa a ser la versión de partida (se acaba de guardar una versión). */
  markCommitted: () => void;
  /** ¿Ya se abrió la rama? Hasta entonces el sitio es el de partida y no hay nada que compartir. */
  ready: boolean;
  /** Lo que el servidor tiene guardado de la rama, según este editor. */
  saved: () => SiteState | null;
  /** Lo que otra persona cambió en vivo: se suma al sitio y a lo guardado (no es de este editor, así que nunca se vuelve a guardar desde aquí). */
  applyRemote: (patch: SitePatch) => void;
  /** Vuelve a abrir la rama desde el servidor (después de que algo la cambió por otro camino, como una fusión). */
  refresh: () => Promise<void>;
}

/**
 * Mantiene el sitio de la rama guardado en la base de datos. Al elegir la rama trae lo último; después de cada cambio (poco
 * después, para no guardar a cada tecla) envía SOLO lo que cambió desde lo que el servidor ya tiene, así guardar nunca borra
 * lo que otra persona añadió mientras tanto. Hasta que termina de cargar no se guarda nada, para no pisar lo guardado.
 * Con `branch` en `null` no hace nada (el visor del sitio publicado, o todavía no se sabe la rama).
 */
export function useSiteSync(state: SiteState, restore: (saved: SiteState) => void, onProblem: (message: string) => void, branch: string | null, remote: (patch: SitePatch) => void): SiteSync {
  /** Lo que el servidor tiene, según este editor (`null` mientras no haya nada guardado). */
  const synced = useRef<SiteState | null>(null);
  /** Los guardados van de uno en uno y en orden: dos parches en vuelo se pisarían. */
  const queue = useRef<Promise<void>>(Promise.resolve());
  const lastRejected = useRef("");
  const latest = useRef({ state, restore, onProblem, branch });
  /** Qué carga (rama y número de recarga) ya llegó, y el sitio de su última versión. */
  const [loaded, setLoaded] = useState<{ token: string; head: SiteState | null } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const token = `${branch}#${reloadKey}`;
  const ready = loaded?.token === token;
  const head = ready ? loaded.head : null;

  useEffect(() => {
    latest.current = { state, restore, onProblem, branch };
  });

  useEffect(() => {
    if (!branch || new URLSearchParams(window.location.search).has("fresh")) return;
    let cancelled = false;
    synced.current = null;
    lastRejected.current = "";
    fetch(urlOf(branch), { headers: HEADERS })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as { site?: SiteState | null; head?: SiteState | null; error?: string };
        if (!response.ok) throw new Error(body.error ?? "No se pudo abrir la rama.");
        return body;
      })
      .then((saved) => {
        if (cancelled) return;
        if (saved.site) {
          synced.current = saved.site;
          latest.current.restore(saved.site);
        }
        setLoaded({ token, head: saved.head ?? null });
      })
      .catch((error: unknown) => !cancelled && latest.current.onProblem(error instanceof Error ? error.message : "No se pudo abrir la rama."));
    return () => {
      cancelled = true;
    };
  }, [branch, token]);

  const save = useCallback(async () => {
    const { state: current, branch: target, onProblem: problem } = latest.current;
    if (!target) return;
    const patch = diffSite(synced.current, current);
    if (!patch) return;

    const response = await fetch(urlOf(target), { method: "PUT", headers: HEADERS, body: JSON.stringify(patch) }).catch(() => null);
    if (!response) return problem("Sin conexión: tus cambios se guardarán cuando vuelva.");
    if (!response.ok) {
      const { error } = (await response.json().catch(() => ({}))) as { error?: string };
      return problem(error ?? "No se pudo guardar el sitio.");
    }

    synced.current = current;
    // El código con errores de sintaxis no se guarda (se conserva la última versión válida): se avisa una vez por cada caso.
    const { rejectedCode } = (await response.json().catch(() => ({ rejectedCode: [] }))) as SaveResult;
    const signature = rejectedCode.map((item) => item.where).join("|");
    if (signature !== lastRejected.current && rejectedCode.length > 0) {
      problem(`Hay código con errores que no se guardó (${rejectedCode.length}). Corrígelo para conservarlo.`);
    }
    lastRejected.current = signature;
  }, []);

  const readyRef = useRef(false);
  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  const flush = useCallback(() => {
    queue.current = queue.current.then(() => (readyRef.current ? save() : undefined));
    return queue.current;
  }, [save]);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(flush, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [ready, state, flush]);

  const markCommitted = useCallback(() => setLoaded((previous) => (previous ? { ...previous, head: synced.current } : previous)), []);
  const refresh = useCallback(async () => {
    await flush();
    setReloadKey((key) => key + 1);
  }, [flush]);
  const saved = useCallback(() => synced.current, []);
  const applyRemote = useCallback(
    (patch: SitePatch) => {
      if (synced.current) synced.current = applyPatchToSite(synced.current, patch);
      remote(patch);
    },
    [remote],
  );
  // Un objeto estable mientras nada cambie: otros efectos dependen de él.
  return useMemo(() => ({ head, flush, markCommitted, refresh, ready, saved, applyRemote }), [head, flush, markCommitted, refresh, ready, saved, applyRemote]);
}
