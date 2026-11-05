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

/** Un despliegue anterior: cuándo, a dónde, quién y cómo salió. */
export interface PastDeploy {
  kind: TargetKind | null;
  status: "queued" | "running" | "succeeded" | "failed";
  error: string | null;
  at: string;
  by: string | null;
}

export type Outcome =
  | { kind: "idle" }
  | { kind: "working"; target: TargetKind; what: "test" | "deploy" }
  | { kind: "ok"; target: TargetKind; url?: string; detail?: string }
  | { kind: "error"; target: TargetKind; message: string };

/** Los destinos de despliegue: leerlos, guardarlos, quitarlos y desplegar. Todo pasa por el servidor, que guarda los secretos. */
export function useDeploy() {
  const [kinds, setKinds] = useState<Record<TargetKind, KindInfo> | null>(null);
  const [targets, setTargets] = useState<SavedTarget[]>([]);
  const [history, setHistory] = useState<PastDeploy[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>({ kind: "idle" });

  type Listing = { kinds?: Record<TargetKind, KindInfo>; targets?: SavedTarget[]; history?: PastDeploy[]; error?: string };
  const show = useCallback((body: Listing, ok: boolean) => {
    if (!ok) return setError(body.error ?? "No se pudo leer la configuración.");
    setKinds(body.kinds ?? null);
    setTargets(body.targets ?? []);
    setHistory(body.history ?? []);
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

  /** Prueba la conexión (`test`) o despliega la publicación en línea (`deploy`). */
  const run = async (kind: TargetKind, what: "test" | "deploy") => {
    setOutcome({ kind: "working", target: kind, what });
    const response = await fetch(URL_OF, { method: "POST", headers: HEADERS, body: JSON.stringify({ kind, action: what }) });
    const body = (await response.json().catch(() => ({}))) as { url?: string; detail?: string; error?: string };
    setOutcome(response.ok ? { kind: "ok", target: kind, url: body.url, detail: body.detail } : { kind: "error", target: kind, message: body.error ?? "No se pudo completar." });
    if (what === "deploy") await read();
  };

  return { kinds, targets, history, error, outcome, save, remove, run };
}
