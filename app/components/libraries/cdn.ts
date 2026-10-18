const JSDELIVR = "https://data.jsdelivr.com/v1/packages/npm";

/** Resuelve la versión de un paquete en el CDN: la pedida si existe, o la última. Lanza el motivo si no. */
export async function resolveCdnVersion(name: string, requested: string): Promise<string> {
  const wanted = requested.trim();

  if (wanted) {
    const response = await fetch(`${JSDELIVR}/${name}@${encodeURIComponent(wanted)}`);
    if (!response.ok) throw new Error(`No existe «${name}@${wanted}» en el CDN.`);
    const data = await response.json().catch(() => ({}));
    return typeof data.version === "string" ? data.version : wanted;
  }

  const response = await fetch(`${JSDELIVR}/${name}`);
  if (!response.ok) throw new Error(`No se encontró «${name}» en el CDN.`);
  const data = await response.json().catch(() => ({}));
  const latest = data.tags?.latest ?? data.versions?.[0]?.version;
  if (typeof latest !== "string") throw new Error(`No se pudo saber la última versión de «${name}».`);
  return latest;
}
