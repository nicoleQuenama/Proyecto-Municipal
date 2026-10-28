/** Los destinos de despliegue y sus datos. Las claves y contraseñas se guardan solo en el servidor y nunca vuelven al navegador. */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type TargetKind = "vercel" | "ftp" | "sftp" | "cpanel";

/** Qué pide cada destino: los datos se ven; los secretos solo se escriben. */
export const TARGET_FIELDS: Record<TargetKind, { label: string; fields: { key: string; label: string; secret?: boolean }[] }> = {
  vercel: { label: "Vercel", fields: [{ key: "project", label: "Nombre del proyecto" }, { key: "team", label: "Equipo (opcional)" }, { key: "token", label: "Token de Vercel", secret: true }] },
  ftp: { label: "FTP", fields: [{ key: "host", label: "Servidor" }, { key: "port", label: "Puerto" }, { key: "user", label: "Usuario" }, { key: "dir", label: "Carpeta" }, { key: "password", label: "Contraseña", secret: true }] },
  sftp: { label: "SFTP / SSH", fields: [{ key: "host", label: "Servidor" }, { key: "port", label: "Puerto" }, { key: "user", label: "Usuario" }, { key: "dir", label: "Carpeta" }, { key: "password", label: "Contraseña", secret: true }] },
  cpanel: { label: "cPanel", fields: [{ key: "host", label: "Dirección del cPanel" }, { key: "user", label: "Usuario" }, { key: "dir", label: "Carpeta (public_html)" }, { key: "token", label: "Token de API", secret: true }] },
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

const DIR = join(process.cwd(), ".cms-data");
const FILE = join(DIR, "deploy-targets.json");

interface Stored {
  targets: Partial<Record<TargetKind, Target & { secrets: Record<string, string> }>>;
}

const read = async (): Promise<Stored> => {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as Stored;
  } catch {
    return { targets: {} };
  }
};

const secretKeys = (kind: TargetKind) => TARGET_FIELDS[kind].fields.filter((f) => f.secret).map((f) => f.key);

export async function listTargets(): Promise<PublicTarget[]> {
  const { targets } = await read();
  return Object.values(targets).flatMap((target) => (target ? [{ kind: target.kind, values: target.values, secretsSet: Object.keys(target.secrets).filter((k) => target.secrets[k]) }] : []));
}

/** Guarda un destino; un secreto vacío conserva el que ya había. */
export async function saveTarget(kind: TargetKind, input: Record<string, string>): Promise<void> {
  const stored = await read();
  const previous = stored.targets[kind];
  const secrets = secretKeys(kind);
  const values = Object.fromEntries(Object.entries(input).filter(([key]) => !secrets.includes(key)).map(([k, v]) => [k, String(v).trim()]));
  const kept = Object.fromEntries(secrets.map((key) => [key, input[key]?.trim() || previous?.secrets[key] || ""]));
  stored.targets[kind] = { kind, values, secrets: kept };
  await mkdir(DIR, { recursive: true });
  await writeFile(FILE, JSON.stringify(stored, null, 2));
}

export async function removeTarget(kind: TargetKind): Promise<void> {
  const stored = await read();
  delete stored.targets[kind];
  await mkdir(DIR, { recursive: true });
  await writeFile(FILE, JSON.stringify(stored, null, 2));
}

/** Para ejecutar un despliegue: datos y secretos juntos (solo en el servidor). */
export async function readTargetWithSecrets(kind: TargetKind) {
  return (await read()).targets[kind] ?? null;
}

export const isTargetKind = (value: unknown): value is TargetKind => typeof value === "string" && value in TARGET_FIELDS;
