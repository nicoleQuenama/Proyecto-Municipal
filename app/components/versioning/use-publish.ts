"use client";

import { useState } from "react";
import { useExternal } from "../external-site/external-context";
import { publishSite } from "../external-site/publish-site";
import { useVersioning } from "./versioning-context";

export type PublishStatus =
  | { kind: "idle" }
  | { kind: "publishing" }
  | { kind: "done"; site: string | null }
  | { kind: "error"; message: string };

/** Publicar: marca la versión como la oficial y, si hay una web del cliente conectada, le envía los cambios. */
export function usePublish() {
  const { dispatch } = useVersioning();
  const external = useExternal();
  const [status, setStatus] = useState<PublishStatus>({ kind: "idle" });

  const publish = async () => {
    setStatus({ kind: "publishing" });
    try {
      if (external.state.site) await publishSite(external.state);
      dispatch({ type: "publish", at: new Date().toISOString() });
      setStatus({ kind: "done", site: external.state.site });
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "No se pudo publicar." });
    }
  };

  return { status, publish, site: external.state.site };
}
