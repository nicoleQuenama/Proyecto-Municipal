/**
 * Los destinos de despliegue, en la base de datos y en DOS niveles: la CUENTA (servidor, usuario, token…) es de la organización
 * (`organization_integrations`, solo la cambia su superadministrador) y el DESTINO (carpeta, nombre del proyecto…) es de cada
 * proyecto (`deploy_targets`). Los secretos van cifrados y nunca vuelven al navegador.
 */

import { decryptJson, encryptJson } from "./secret-box";
import type { Tx } from "./db";
import type { Scope } from "./site/site-sql";

export type TargetKind = "vercel" | "ftp" | "sftp" | "cpanel";

interface Field {
  key: string;
  label: string;
  secret?: boolean;
  /** `org`: es de la cuenta de la organización; `project`: es de este proyecto. */
  level: "org" | "project";
}

/** Qué pide cada destino: los datos se ven; los secretos solo se escriben. */
export const TARGET_FIELDS: Record<TargetKind, { label: string; fields: Field[] }> = {
  vercel: { label: "Vercel", fields: [{ key: "project", label: "Nombre del proyecto", level: "project" }, { key: "team", label: "Equipo (opcional)", level: "org" }, { key: "token", label: "Token de Vercel", secret: true, level: "org" }] },
  ftp: { label: "FTP", fields: [{ key: "host", label: "Servidor", level: "org" }, { key: "port", label: "Puerto (21 por defecto)", level: "org" }, { key: "secure", label: "Conexión cifrada FTPS (escribe «si» para activarla)", level: "org" }, { key: "user", label: "Usuario", level: "org" }, { key: "dir", label: "Carpeta del servidor (p. ej. /public_html/sitio)", level: "project" }, { key: "password", label: "Contraseña", secret: true, level: "org" }] },
  sftp: { label: "SFTP / SSH", fields: [{ key: "host", label: "Servidor", level: "org" }, { key: "port", label: "Puerto (22 por defecto)", level: "org" }, { key: "user", label: "Usuario", level: "org" }, { key: "dir", label: "Carpeta del servidor (p. ej. /var/www/sitio)", level: "project" }, { key: "password", label: "Contraseña", secret: true, level: "org" }] },
  cpanel: { label: "cPanel", fields: [{ key: "host", label: "Dirección del cPanel (p. ej. servidor.com:2083)", level: "org" }, { key: "user", label: "Usuario de cPanel", level: "org" }, { key: "dir", label: "Carpeta (p. ej. public_html/sitio)", level: "project" }, { key: "token", label: "Token de API (cPanel › Seguridad › Administrar tokens de API)", secret: true, level: "org" }] },
};

export interface Target {
  kind: TargetKind;
  /** Los datos que no son secretos. */
  values: Record<string, string>;
}

/** Lo que ve el navegador: los datos, y de cada secreto solo si ya hay uno guardado. */
export interface PublicTarget extends Target {
  secretsSet: string[];
}

type Strings = Record<string, string>;
interface Stored {
  values: Strings;
  secrets: Strings;
}

const keysOf = (kind: TargetKind, level: Field["level"], secret: boolean) => TARGET_FIELDS[kind].fields.filter((field) => field.level === level && !!field.secret === secret).map((field) => field.key);
const pick = (source: Strings, keys: string[]): Strings => Object.fromEntries(keys.filter((key) => key in source).map((key) => [key, source[key]]));

/** La cuenta de la organización y el destino del proyecto, juntos (solo si el proyecto usa este destino). */
async function read(tx: Tx, scope: Scope, kind: TargetKind): Promise<Stored | null> {
  const [project] = await tx.unsafe(`select config from app.deploy_targets where organization_id = $1 and project_id = $2 and kind = $3`, [scope.org, scope.project, kind]);
  if (!project) return null;
  const [account] = await tx.unsafe(`select config, secrets_enc from app.organization_integrations where organization_id = $1 and kind = $2`, [scope.org, kind]);
  const secrets = account?.secrets_enc ? (decryptJson(account.secrets_enc as Buffer) as Strings) : {};
  return { values: { ...(account?.config as Strings | undefined), ...(project.config as Strings) }, secrets };
}

export async function listTargets(tx: Tx, scope: Scope): Promise<PublicTarget[]> {
  const found = await Promise.all((Object.keys(TARGET_FIELDS) as TargetKind[]).map(async (kind) => ({ kind, stored: await read(tx, scope, kind) })));
  return found.flatMap(({ kind, stored }) => (stored ? [{ kind, values: stored.values, secretsSet: Object.keys(stored.secrets).filter((key) => stored.secrets[key]) }] : []));
}

/** Guarda un destino; un secreto vacío conserva el que ya había. La cuenta solo se escribe si cambió (solo el superadministrador puede). */
export async function saveTarget(tx: Tx, scope: Scope, userId: string, kind: TargetKind, input: Strings): Promise<void> {
  const clean = Object.fromEntries(Object.entries(input).map(([key, value]) => [key, String(value).trim()]));
  const previous = await read(tx, scope, kind);

  await tx.unsafe(
    `insert into app.deploy_targets (organization_id, project_id, kind, config, created_by) values ($1, $2, $3, $4::jsonb, $5)
     on conflict (organization_id, project_id, kind) do update set config = excluded.config, updated_at = now(), row_version = app.deploy_targets.row_version + 1`,
    [scope.org, scope.project, kind, pick(clean, keysOf(kind, "project", false)) as never, userId],
  );

  const accountValues = pick(clean, keysOf(kind, "org", false));
  const accountSecrets = Object.fromEntries(keysOf(kind, "org", true).map((key) => [key, clean[key] || previous?.secrets[key] || ""]));
  const unchanged = previous && JSON.stringify(pick(previous.values, keysOf(kind, "org", false))) === JSON.stringify(accountValues) && JSON.stringify(previous.secrets) === JSON.stringify(accountSecrets);
  if (unchanged) return;
  await tx.unsafe(
    `insert into app.organization_integrations (organization_id, kind, config, secrets_enc, updated_by) values ($1, $2, $3::jsonb, $4, $5)
     on conflict (organization_id, kind) do update set config = excluded.config, secrets_enc = excluded.secrets_enc, updated_by = excluded.updated_by, updated_at = now()`,
    [scope.org, kind, accountValues as never, encryptJson(accountSecrets), userId],
  );
}

/** Quita el destino de este proyecto (la cuenta de la organización se queda: otros proyectos pueden usarla). */
export async function removeTarget(tx: Tx, scope: Scope, kind: TargetKind): Promise<void> {
  await tx.unsafe(`delete from app.deploy_targets where organization_id = $1 and project_id = $2 and kind = $3`, [scope.org, scope.project, kind]);
}

/** Para ejecutar un despliegue: datos y secretos juntos (solo en el servidor). */
export const readTargetWithSecrets = read;

export const isTargetKind = (value: unknown): value is TargetKind => typeof value === "string" && value in TARGET_FIELDS;
