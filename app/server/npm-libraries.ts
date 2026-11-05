/**
 * Instalar y desinstalar librerías en este proyecto con pnpm (el único gestor del proyecto),
 * y empaquetarlas para el navegador.
 *
 * Solo se permite en desarrollo y desde esta misma máquina: instalar un paquete ejecuta código ajeno
 * en tu equipo, así que ninguna otra página ni equipo de la red puede pedirlo.
 */

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db, type Tx } from "./db";
import { REQUEST_HEADER } from "./request-header";
import type { Scope } from "./site/site-sql";

const ROOT = process.cwd();
const INSTALL_TIMEOUT_MS = 3 * 60 * 1000;


const PACKAGE_NAME = /^(@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
/** Versión exacta, rango simple o etiqueta: «1.2.3», «^1.2.0», «latest». Sin espacios ni símbolos de shell. */
const PACKAGE_VERSION = /^[\^~]?[a-z0-9][a-z0-9._+-]*$/i;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export const isValidName = (name: string) => name.length <= 214 && PACKAGE_NAME.test(name);
export const isValidVersion = (version: string) => version.length <= 64 && PACKAGE_VERSION.test(version);

/** ¿Se puede instalar aquí? Solo en desarrollo; el motivo si no. */
export function availability(): { available: boolean; reason?: string } {
  if (process.env.NODE_ENV === "production") {
    return { available: false, reason: "Instalar con pnpm solo funciona con el servidor de desarrollo." };
  }
  return pnpmCommand() ? { available: true } : { available: false, reason: "Inicia el servidor con `pnpm dev` para instalar librerías." };
}

/** Valida que la petición venga de esta misma página, abierta en esta misma máquina. */
export function guardRequest(request: Request): Response | null {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  const sameOrigin = origin === null || new URL(origin).host === url.host;

  if (!LOCAL_HOSTS.has(url.hostname) || !sameOrigin || request.headers.get(REQUEST_HEADER) !== "1") {
    return Response.json({ error: "Petición no permitida." }, { status: 403 });
  }
  const { available, reason } = availability();
  return available ? null : Response.json({ error: reason }, { status: 403 });
}

// ---------- lista de librerías instaladas por cada organización (en la base de datos) ----------

/** Los paquetes que instaló esta organización. */
const ownNames = async (tx: Tx, scope: Scope): Promise<string[]> =>
  (await tx.unsafe(`select name from app.organization_packages where organization_id = $1 order by name`, [scope.org])).map((row) => row.name as string);

/** Los que instaló cualquier organización (el disco es compartido). */
const everyonesNames = async (): Promise<Set<string>> => new Set((await db()`select app.installed_package_names() as name`).map((row) => row.name as string));

/** Los paquetes de `package.json` que no instaló ninguna organización (next, react…): no se tocan. */
async function protectedPackages(): Promise<Set<string>> {
  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  const installed = await everyonesNames();
  return new Set(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((name) => !installed.has(name)));
}

export interface InstalledLibrary {
  name: string;
  version: string;
}

async function versionOf(name: string): Promise<string | null> {
  try {
    const pkg = JSON.parse(await readFile(path.join(ROOT, "node_modules", name, "package.json"), "utf8"));
    return typeof pkg.version === "string" ? pkg.version : null;
  } catch {
    return null;
  }
}

/** Las librerías que esta organización instaló desde la app y siguen en `node_modules`. */
export async function listInstalled(tx: Tx, scope: Scope): Promise<InstalledLibrary[]> {
  const names = await ownNames(tx, scope);
  const found = await Promise.all(names.map(async (name) => ({ name, version: await versionOf(name) })));
  return found.filter((lib): lib is InstalledLibrary => lib.version !== null);
}

// ---------- pnpm ----------

/**
 * Cómo ejecutar pnpm. Al lanzar el servidor con `pnpm dev`, pnpm deja su propia ruta en `npm_execpath`:
 * se usa esa, con el mismo Node y sin shell, para que nada de lo recibido se interprete como un comando.
 */
function pnpmCommand(): { file: string; prefix: string[] } | null {
  const exec = process.env.npm_execpath;
  if (!exec || !path.basename(exec).toLowerCase().includes("pnpm") || !existsSync(exec)) return null;
  return /\.(c|m)?js$/i.test(exec) ? { file: process.execPath, prefix: [exec] } : { file: exec, prefix: [] };
}

function runPnpm(args: string[]): Promise<void> {
  const command = pnpmCommand();
  if (!command) return Promise.reject(new Error("Inicia el servidor con `pnpm dev` para poder instalar librerías."));

  return new Promise((resolve, reject) => {
    execFile(
      command.file,
      [...command.prefix, ...args],
      { cwd: ROOT, timeout: INSTALL_TIMEOUT_MS, windowsHide: true },
      (error, _stdout, stderr) => {
        if (!error) return resolve();
        const detail = stderr.split("\n").find((line) => line.includes("ERR")) ?? error.message;
        reject(new Error(detail.replace(/^.*?ERR_PNPM_[A-Z_]+\s*/, "").trim() || error.message));
      },
    );
  });
}

/** `pnpm add nombre@versión`. Los scripts del paquete no se ejecutan. */
export async function installLibrary(tx: Tx, scope: Scope, userId: string, name: string, version: string): Promise<InstalledLibrary> {
  if ((await protectedPackages()).has(name)) throw new Error(`«${name}» es parte de este proyecto y no se puede cambiar.`);

  await runPnpm(["add", `${name}@${version || "latest"}`, "--ignore-scripts"]);

  const installed = await versionOf(name);
  if (!installed) throw new Error(`No se pudo instalar «${name}».`);

  await tx.unsafe(
    `insert into app.organization_packages (organization_id, name, version, installed_by) values ($1, $2, $3, $4)
     on conflict (organization_id, name) do update set version = excluded.version, installed_by = excluded.installed_by, installed_at = now()`,
    [scope.org, name, installed, userId],
  );
  return { name, version: installed };
}

/** Quita la librería de esta organización; del disco solo si ninguna otra la tiene (`pnpm remove`). */
export async function uninstallLibrary(tx: Tx, scope: Scope, name: string): Promise<void> {
  if (!(await ownNames(tx, scope)).includes(name)) throw new Error(`«${name}» no se instaló desde la app.`);

  await tx.unsafe(`delete from app.organization_packages where organization_id = $1 and name = $2`, [scope.org, name]);
  if (!(await everyonesNames()).has(name)) await runPnpm(["remove", name]);
}

// ---------- empaquetado para el navegador ----------

const bundles = new Map<string, string>();

/** El código ES de una librería ya instalada, con sus dependencias, listo para `import` en el navegador. */
export async function bundleLibrary(name: string): Promise<string> {
  const version = await versionOf(name);
  if (!version || !(await everyonesNames()).has(name)) throw new Error("Librería no instalada.");

  const cached = bundles.get(`${name}@${version}`);
  if (cached) return cached;

  // esbuild se carga al usarlo: es un binario nativo que no hace falta en el resto de la app.
  const { build } = await import("esbuild");
  const attempt = (contents: string) =>
    build({
      stdin: { contents, resolveDir: ROOT, loader: "js" },
      bundle: true,
      format: "esm",
      platform: "browser",
      target: "es2020",
      minify: true,
      write: false,
      define: { "process.env.NODE_ENV": '"production"' },
      logLevel: "silent",
    });

  // Si el paquete no tiene export por defecto, se reexportan solo sus nombres.
  const result = await attempt(`export * from ${JSON.stringify(name)}; export { default } from ${JSON.stringify(name)};`).catch(
    () => attempt(`export * from ${JSON.stringify(name)};`),
  );

  const text = result.outputFiles[0].text;
  bundles.set(`${name}@${version}`, text);
  return text;
}
