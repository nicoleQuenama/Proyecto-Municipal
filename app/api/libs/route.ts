import type { Actor } from "../../server/auth-accounts";
import { sessionActor } from "../../server/auth-session";
import { inProject } from "../../server/site-access";
import {
  availability,
  guardRequest,
  installLibrary,
  isValidName,
  isValidVersion,
  listInstalled,
  uninstallLibrary,
} from "../../server/npm-libraries";

const fail = (error: unknown, status = 400) =>
  Response.json({ error: error instanceof Error ? error.message : "Error inesperado." }, { status });

/** Instalar o quitar librerías es parte del acceso al código: solo superadmin y dev. */
async function manager(): Promise<Actor | null> {
  const actor = await sessionActor();
  const user = actor?.user;
  return actor && (user?.role === "superadmin" || user?.role === "dev") && !user.access?.denied.includes("installLibraries") ? actor : null;
}

const forbidden = () => Response.json({ error: "No tienes permiso para gestionar librerías." }, { status: 403 });

/** Si se puede instalar con pnpm aquí, y qué librerías instaló ya el usuario. */
export async function GET(request: Request) {
  const denied = guardRequest(request);
  if (denied) return Response.json({ ...availability(), available: false, installed: [] });
  const actor = await manager();
  if (!actor) return forbidden();

  return Response.json({ ...availability(), installed: await inProject(actor, listInstalled) });
}

/** `pnpm add nombre@versión` en este proyecto. */
export async function POST(request: Request) {
  const denied = guardRequest(request);
  if (denied) return denied;
  const actor = await manager();
  if (!actor) return forbidden();

  const { name, version = "" } = (await request.json().catch(() => ({}))) as { name?: string; version?: string };
  if (!name || !isValidName(name)) return fail("Nombre de paquete no válido.");
  if (version && !isValidVersion(version)) return fail("Versión no válida.");

  try {
    return Response.json(await inProject(actor, (tx, scope) => installLibrary(tx, scope, actor.user.id, name, version)));
  } catch (error) {
    return fail(error, 500);
  }
}

/** `pnpm remove nombre`, solo de lo instalado desde la app. */
export async function DELETE(request: Request) {
  const denied = guardRequest(request);
  if (denied) return denied;
  const actor = await manager();
  if (!actor) return forbidden();

  const name = new URL(request.url).searchParams.get("name");
  if (!name || !isValidName(name)) return fail("Nombre de paquete no válido.");

  try {
    await inProject(actor, (tx, scope) => uninstallLibrary(tx, scope, name));
    return Response.json({ name });
  } catch (error) {
    return fail(error, 500);
  }
}
