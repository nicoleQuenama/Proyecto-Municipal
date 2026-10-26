import { REQUEST_HEADER } from "../../server/request-header";
import { transpileTypeScript } from "../code/transpile";
import { serverPolicy } from "./cache-strategies";
import { buildUrl, type PageParams } from "./build-request";
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

/** Pide la API desde el navegador, con la misma forma de respuesta que el proxy. */
async function askDirectly(url: string, method: string, headers: Record<string, string>, proxyError: string) {
  try {
    const response = await fetch(url, { method, headers });
    return { status: response.status, contentType: response.headers.get("content-type") ?? "", body: await response.text() };
  } catch (error) {
    const direct = error instanceof Error ? error.message : "sin respuesta";
    throw new Error(`${proxyError ?? "No se pudo pedir la API."} · Directo desde el navegador: ${direct}`);
  }
}

/** Pide la fuente a través del proxy del servidor y devuelve los datos ya leídos. */
export async function fetchSource(source: DataSource, refresh = false, params: PageParams = {}): Promise<unknown> {
  const url = buildUrl(source, new Date(), params);
  if (!url) throw new Error("La URL no es válida o le falta un parámetro de la página ({param:…}).");

  const headers = Object.fromEntries(source.headers.filter((h) => h.key.trim()).map((h) => [h.key.trim(), h.value]));
  const response = await fetch("/api/proxy", {
    method: "POST",
    headers: { "content-type": "application/json", [REQUEST_HEADER]: "1" },
    body: JSON.stringify({ url, method: source.method, headers, cache: serverPolicy(source.cache), refresh }),
  });
  const proxied = await response.json().catch(() => ({}));
  // Si el servidor no logra llegar a la API (p. ej. un antivirus que intercepta HTTPS), el navegador la pide directo:
  // sirve con las APIs públicas que permiten CORS.
  const result = response.status === 502 ? await askDirectly(url, source.method, headers, proxied.error) : proxied;
  if (!response.ok && response.status !== 502) throw new Error(result.error ?? "No se pudo pedir la API.");
  if (result.status >= 400) throw new Error(`La API respondió ${result.status}.`);

  return shape(parseBody(result.contentType, result.body), source.transform);
}
