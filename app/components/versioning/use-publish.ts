"use client";

import { useState } from "react";
import { useVersioning } from "./versioning-context";

export type PublishStatus =
  | { kind: "idle" }
  | { kind: "publishing" }
  | { kind: "done" }
  | { kind: "error"; message: string };

/** Publicar: marca la versión como la oficial y deja el sitio en el servidor, para que el público lo vea en /ver. */
export function usePublish() {
  const { publish: publishBranch } = useVersioning();
  const [status, setStatus] = useState<PublishStatus>({ kind: "idle" });

  const publish = async () => {
    setStatus({ kind: "publishing" });
    try {
      await publishBranch();
      setStatus({ kind: "done" });
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "No se pudo publicar." });
    }
  };

  return { status, publish };
}
