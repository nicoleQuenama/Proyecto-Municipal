import { REQUEST_HEADER } from "../../server/request-header";

/** Añade https:// si falta y comprueba que sea una dirección web. Devuelve null si no lo es. */
export function normalizeSiteUrl(raw: string): URL | null {
  const text = raw.trim();
  if (!text) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    return url.hostname.includes(".") || url.hostname === "localhost" ? url : null;
  } catch {
    return null;
  }
}

/** Lo que se quita de la página real para mostrarla de forma segura dentro del editor. */
const UNSAFE = "script, noscript, meta[http-equiv='refresh' i], link[rel='preload'], link[rel='modulepreload']";

/** El HTML de la página listo para el editor: sin scripts y con `<base>` para que carguen sus estilos e imágenes. */
export function prepareDocument(html: string, pageUrl: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll(UNSAFE).forEach((node) => node.remove());

  const base = doc.createElement("base");
  base.href = pageUrl;
  doc.head.prepend(base);
  return `<!doctype html>${doc.documentElement.outerHTML}`;
}

/** Pide la página del cliente a través del proxy del servidor (sin CORS) y la deja lista para el editor. */
export async function loadPage(url: URL): Promise<string> {
  const response = await fetch("/api/proxy", {
    method: "POST",
    headers: { "content-type": "application/json", [REQUEST_HEADER]: "1" },
    body: JSON.stringify({ url: url.toString(), refresh: true }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? "No se pudo abrir la página.");
  if (result.status >= 400) throw new Error(`La página respondió ${result.status}.`);
  if (!/html/i.test(result.contentType)) throw new Error("La dirección no es una página web (HTML).");
  return prepareDocument(result.body, url.toString());
}
