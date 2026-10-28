"use client";

import { useState } from "react";
import { REQUEST_HEADER } from "../../server/request-header";
import { useSite } from "../site/site-context";
import { useVersioning } from "./versioning-context";

export type PublishStatus =
  | { kind: "idle" }
  | { kind: "publishing" }
  | { kind: "done" }
  | { kind: "error"; message: string };

/** Publicar: marca la versión como la oficial y deja el sitio en el servidor, para que el público lo vea en /ver. */
export function usePublish() {
  const { dispatch } = useVersioning();
  const site = useSite();
  const [status, setStatus] = useState<PublishStatus>({ kind: "idle" });

  const publish = async () => {
    setStatus({ kind: "publishing" });
    try {
      const response = await fetch("/api/cms/publish", {
        method: "POST",
        headers: { "content-type": "application/json", [REQUEST_HEADER]: "1" },
        body: JSON.stringify(site),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "No se pudo publicar el sitio.");
      }
      dispatch({ type: "publish", at: new Date().toISOString() });
      setStatus({ kind: "done" });
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "No se pudo publicar." });
    }
  };

  return { status, publish };
}
