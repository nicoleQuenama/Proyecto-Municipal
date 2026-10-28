"use client";

import { useCallback, useEffect, useState } from "react";
import { REQUEST_HEADER } from "../../server/request-header";

const URL_OF = "/api/cms/deploy";
const HEADERS = { "content-type": "application/json", [REQUEST_HEADER]: "1" };

export type TargetKind = "vercel" | "ftp" | "sftp" | "cpanel";

export interface KindInfo {
  label: string;
  fields: { key: string; label: string; secret?: boolean }[];
}

export interface SavedTarget {
  kind: TargetKind;
  values: Record<string, string>;
  secretsSet: string[];
}

export type Outcome = { kind: "idle" } | { kind: "working"; target: TargetKind } | { kind: "ok"; target: TargetKind; url?: string } | { kind: "error"; target: TargetKind; message: string };

/** Los destinos de despliegue: leerlos, guardarlos, quitarlos y desplegar. Todo pasa por el servidor, que guarda los secretos. */
export function useDeploy() {
  const [kinds, setKinds] = useState<Record<TargetKind, KindInfo> | null>(null);
  const [targets, setTargets] = useState<SavedTarget[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>({ kind: "idle" });

  type Listing = { kinds?: Record<TargetKind, KindInfo>; targets?: SavedTarget[]; error?: string };
  const show = useCallback((body: Listing, ok: boolean) => {
    if (!ok) return setError(body.error ?? "No se pudo leer la configuración.");
    setKinds(body.kinds ?? null);
    setTargets(body.targets ?? []);
  }, []);
  const read = useCallback(async () => {
    const response = await fetch(URL_OF, { headers: HEADERS });
    show((await response.json().catch(() => ({}))) as Listing, response.ok);
  }, [show]);

  // Leer al abrir el panel: la respuesta llega después, no durante el render.
  useEffect(() => {
    let cancelled = false;
    fetch(URL_OF, { headers: HEADERS })
      .then(async (response) => ({ body: (await response.json().catch(() => ({}))) as Listing, ok: response.ok }))
      .then(({ body, ok }) => !cancelled && show(body, ok))
      .catch(() => !cancelled && setError("No se pudo leer la configuración."));
    return () => {
      cancelled = true;
    };
  }, [show]);

  const save = async (kind: TargetKind, values: Record<string, string>) => {
    await fetch(URL_OF, { method: "PUT", headers: HEADERS, body: JSON.stringify({ kind, values }) });
    await read();
  };

  const remove = async (kind: TargetKind) => {
    await fetch(`${URL_OF}?kind=${kind}`, { method: "DELETE", headers: HEADERS });
    await read();
  };

  const run = async (kind: TargetKind) => {
    setOutcome({ kind: "working", target: kind });
    const response = await fetch(URL_OF, { method: "POST", headers: HEADERS, body: JSON.stringify({ kind }) });
    const body = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
    setOutcome(response.ok ? { kind: "ok", target: kind, url: body.url } : { kind: "error", target: kind, message: body.error ?? "No se pudo desplegar." });
  };

  return { kinds, targets, error, outcome, save, remove, run };
}
