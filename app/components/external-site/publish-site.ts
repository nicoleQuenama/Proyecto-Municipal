import { REQUEST_HEADER } from "../../server/request-header";
import { buildManifest } from "./build-manifest";
import type { ExternalState } from "./types";

/** Publica los cambios en la página oficial del cliente. Devuelve la fecha de publicación. */
export async function publishSite(state: ExternalState): Promise<string> {
  const manifest = buildManifest(state);
  if (!manifest) throw new Error("No hay ningún sitio conectado.");

  const response = await fetch("/api/cms/publish", {
    method: "POST",
    headers: { "content-type": "application/json", [REQUEST_HEADER]: "1" },
    body: JSON.stringify(manifest),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? "No se pudo publicar.");
  return result.publishedAt as string;
}
