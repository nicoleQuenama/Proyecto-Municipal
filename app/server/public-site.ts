import { db } from "./db";
import { EXPORTED_SITE } from "./exported-site";

type Row = { snapshot: unknown };

/**
 * El sitio publicado que ve el público (sin sesión): el del dominio por el que llegó la visita, y si no hay dominio
 * (desarrollo, un solo sitio por servidor) el de la organización que este servidor atiende (`PORTAL_ORG_SLUG`).
 * Sin base de datos configurada (un sitio exportado) se sirve el que el paquete trae compilado.
 */
export async function readPublicSite(host: string | null): Promise<string | null> {
  if (!process.env.DATABASE_URL) return EXPORTED_SITE ? JSON.stringify(EXPORTED_SITE) : null;

  const hostname = host?.split(":")[0].toLowerCase() ?? "";
  const byDomain = hostname ? ((await db()`select snapshot from app.resolve_public_site(${hostname}) limit 1`) as unknown as Row[]) : [];
  const rows = byDomain.length > 0 || !process.env.PORTAL_ORG_SLUG ? byDomain : ((await db()`select snapshot from app.resolve_public_site_by_org(${process.env.PORTAL_ORG_SLUG}) limit 1`) as unknown as Row[]);
  return rows[0] ? JSON.stringify(rows[0].snapshot) : null;
}
