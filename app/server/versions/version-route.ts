import { sessionActor } from "../auth-session";
import type { Actor } from "../auth-accounts";
import { isPgError } from "../db";
import { sameOriginRequest } from "../proxy-guard";
import { VersionError } from "./branch-rows";

const refuse = (error: string, status: number, extra: Record<string, unknown> = {}) => Response.json({ error, ...extra }, { status });

/** Errores de la base de datos con mensaje propio y pensado para la persona (los lanzan las funciones y disparadores de `db/`). */
const DATABASE_ERRORS: [code: string, status: number][] = [
  ["42501", 403],
  ["22023", 400],
  ["23514", 409],
  ["P0002", 404],
  ["40001", 409],
];

/** Lo común de las rutas de versiones: mismo origen, sesión vigente y errores con su código y su mensaje. */
export async function versionRoute(request: Request, work: (actor: Actor) => Promise<unknown>, status = 200): Promise<Response> {
  if (!sameOriginRequest(request)) return refuse("Petición no permitida.", 403);
  const actor = await sessionActor();
  if (!actor) return refuse("Tu sesión terminó o tu acceso venció.", 401);
  try {
    return Response.json(await work(actor), { status, headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof VersionError) return refuse(error.message, error.status, error.extra);
    const known = DATABASE_ERRORS.find(([code]) => isPgError(error, code));
    if (known) return refuse((error as Error).message, known[1]);
    console.error("[versiones]", error);
    return refuse("No se pudo completar la operación.", 500);
  }
}
