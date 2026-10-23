import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { REQUEST_HEADER } from "./request-header";

const PRIVATE_V4 = [/^10\./, /^127\./, /^169\.254\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^0\./];

function isPrivateAddress(address: string): boolean {
  const lower = address.toLowerCase();
  if (isIP(lower) === 6) return lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80");
  return PRIVATE_V4.some((range) => range.test(lower));
}

/** La petición debe venir de esta misma página (otro origen no puede usar el proxy). */
export function sameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  const sameOrigin = origin === null || new URL(origin).host === new URL(request.url).host;
  return sameOrigin && request.headers.get(REQUEST_HEADER) === "1";
}

/** Solo http(s) hacia internet: el proxy no debe poder llegar a la red interna de quien lo aloja. */
export async function checkTarget(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Solo se admiten URLs http o https.");

  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true })).map((entry) => entry.address);
  if (addresses.some(isPrivateAddress)) throw new Error("No se puede pedir a direcciones de la red interna.");
  return url;
}
