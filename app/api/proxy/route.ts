import { checkTarget, sameOriginRequest } from "../../server/proxy-guard";
import { cacheKey, readCache, writeCache, type ServerCachePolicy } from "../../server/response-cache";

const MAX_BYTES = 5_000_000;
const TIMEOUT_MS = 15_000;

interface ProxyInput {
  url?: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  /** Cómo guarda el servidor la respuesta. */
  cache?: ServerCachePolicy;
  /** Ignora lo guardado y pide de nuevo (el botón «Probar»). */
  refresh?: boolean;
}

const MAX_REDIRECTS = 5;

/** Sigue las redirecciones a mano: cada destino pasa la misma revisión que el primero (nada interno). */
async function fetchFollowing(first: URL, method: string, headers: Record<string, string>): Promise<Response> {
  let target = first;
  for (let hop = 0; ; hop++) {
    const response = await fetch(target, {
      method,
      headers,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const location = response.headers.get("location");
    if (response.status < 300 || response.status >= 400 || !location) return response;
    if (hop >= MAX_REDIRECTS) throw new Error("Demasiadas redirecciones.");
    target = await checkTarget(new URL(location, target).toString());
  }
}

const fail = (error: string, status: number) => Response.json({ error }, { status });

/** Pide una API en nombre de la página: sin CORS, sin enseñar las claves al visitante y con caché de servidor. */
export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return fail("Petición no permitida.", 403);

  const { url, method = "GET", headers = {}, cache = { kind: "none" }, refresh = false } = (await request
    .json()
    .catch(() => ({}))) as ProxyInput;
  if (!url) return fail("Falta la URL.", 400);

  try {
    const target = await checkTarget(url);
    const key = cacheKey([method, target.toString(), headers]);

    const saved = refresh ? null : await readCache(key, cache);
    if (saved) return Response.json({ ...saved, cached: true });

    const response = await fetchFollowing(target, method, headers);
    const body = await response.text();
    if (body.length > MAX_BYTES) return fail("La respuesta es demasiado grande (máx. 5 MB).", 413);

    const entry = { at: Date.now(), status: response.status, contentType: response.headers.get("content-type") ?? "", body };
    if (response.ok) await writeCache(key, cache, entry);
    return Response.json({ ...entry, cached: false });
  } catch (error) {
    // «fetch failed» no dice nada: la causa real (certificado, DNS, conexión) viene en `cause`.
    const cause = error instanceof Error && error.cause instanceof Error ? ` (${(error.cause as { code?: string }).code ?? error.cause.message})` : "";
    return fail(error instanceof Error ? `${error.message}${cause}` : "No se pudo completar la petición.", 502);
  }
}
