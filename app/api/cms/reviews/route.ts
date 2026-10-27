import { sessionUser } from "../../../server/auth-session";
import { sameOriginRequest } from "../../../server/proxy-guard";
import { decide, listFor, open, type Decision, type NewReview } from "../../../server/review-store";

const refuse = (error: string, status: number) => Response.json({ error }, { status });

/** Quien hace la petición, o la respuesta de rechazo. */
async function caller() {
  const user = await sessionUser();
  return user ? { user } : { denied: refuse("Tu sesión terminó o tu acceso venció.", 401) };
}

/** Las pull requests de equipo que esta persona envió o tiene que revisar. */
export async function GET(request: Request) {
  if (!sameOriginRequest(request)) return refuse("Petición no permitida.", 403);
  const { user, denied } = await caller();
  return denied ?? Response.json({ pullRequests: await listFor(user) });
}

/** Envía una pull request: `{ title, from, into, changes }`. */
export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return refuse("Petición no permitida.", 403);
  const { user, denied } = await caller();
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as NewReview | null;
  if (!body) return refuse("Faltan datos.", 400);
  try {
    return Response.json({ pullRequest: await open(user, body) }, { status: 201 });
  } catch (error) {
    return refuse(error instanceof Error ? error.message : "No se pudo enviar.", 400);
  }
}

/** Decide sobre una: `{ number, decision: "merge" | "close" }`. */
export async function PATCH(request: Request) {
  if (!sameOriginRequest(request)) return refuse("Petición no permitida.", 403);
  const { user, denied } = await caller();
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as { number?: unknown; decision?: unknown } | null;
  if (typeof body?.number !== "number" || (body.decision !== "merge" && body.decision !== "close")) return refuse("Faltan datos.", 400);
  try {
    return Response.json({ pullRequest: await decide(user, body.number, body.decision as Decision) });
  } catch (error) {
    return refuse(error instanceof Error ? error.message : "No se pudo completar.", 403);
  }
}
