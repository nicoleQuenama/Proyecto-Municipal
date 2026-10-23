import { REQUEST_HEADER } from "../../server/request-header";
import { transpileTypeScript } from "../code/transpile";
import { serverPolicy } from "./cache-strategies";
import { buildUrl } from "./build-request";
import { parseBody } from "./parse-body";
import type { DataSource } from "./types";

/** Aplica el TypeScript del usuario a la respuesta: una función `(data) => …`. */
function shape(data: unknown, transform: string): unknown {
  if (!transform.trim()) return data;
  const js = transpileTypeScript(transform).trim().replace(/;$/, "");
  const run = new Function(`"use strict"; return (${js});`)();
  if (typeof run !== "function") throw new Error("El código debe ser una función: (data) => …");
  return run(data);
}

/** Pide la fuente a través del proxy del servidor y devuelve los datos ya leídos. */
export async function fetchSource(source: DataSource, refresh = false): Promise<unknown> {
  const url = buildUrl(source);
  if (!url) throw new Error("La URL no es válida.");

  const headers = Object.fromEntries(source.headers.filter((h) => h.key.trim()).map((h) => [h.key.trim(), h.value]));
  const response = await fetch("/api/proxy", {
    method: "POST",
    headers: { "content-type": "application/json", [REQUEST_HEADER]: "1" },
    body: JSON.stringify({ url, method: source.method, headers, cache: serverPolicy(source.cache), refresh }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? "No se pudo pedir la API.");
  if (result.status >= 400) throw new Error(`La API respondió ${result.status}.`);

  return shape(parseBody(result.contentType, result.body), source.transform);
}
