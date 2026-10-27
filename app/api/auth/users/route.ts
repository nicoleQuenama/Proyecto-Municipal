import { RESTRICTION_LABELS, parseAccess, type Access, type Restriction } from "../../../components/auth/access";
import type { NewUser, User, UserRole } from "../../../components/auth/types";
import { sessionUser } from "../../../server/auth-session";
import { createUser, deleteUser, findStored, listManaged, setAccess } from "../../../server/auth-store";
import { sameOriginRequest } from "../../../server/proxy-guard";

/** Cuánto puede un rol: nadie invita a alguien con más rol que el suyo. */
const RANK: Record<UserRole, number> = { designer: 0, dev: 1, superadmin: 2 };
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const EVERYTHING_DENIED = Object.keys(RESTRICTION_LABELS) as Restriction[];

const refuse = (error: string, status = 403) => Response.json({ error }, { status });
const notAllowed = () => refuse("Petición no permitida.");

/** Quien hace la petición, si puede compartir el proyecto (todos, salvo quien tenga vetado invitar). */
async function sharer(): Promise<User | null> {
  const user = await sessionUser();
  return user && !user.access?.denied.includes("invite") ? user : null;
}

/** ¿Puede gestionar esta cuenta? El superadministrador cualquiera; los demás, las que ellos invitaron. */
async function manages(manager: User, targetId: string): Promise<boolean> {
  if (manager.role === "superadmin") return true;
  return (await findStored(targetId))?.invitedBy === manager.id;
}

export async function GET(request: Request) {
  if (!sameOriginRequest(request)) return notAllowed();
  const manager = await sharer();
  if (!manager) return refuse("No tienes permiso para compartir el proyecto.");

  return Response.json({ users: await listManaged(manager.id, manager.role === "superadmin") });
}

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return notAllowed();
  const manager = await sharer();
  if (!manager) return refuse("No tienes permiso para invitar a otras personas.");

  const body = (await request.json().catch(() => null)) as Partial<NewUser> | null;
  if (
    !body ||
    typeof body.name !== "string" ||
    typeof body.username !== "string" ||
    typeof body.email !== "string" ||
    typeof body.password !== "string" ||
    typeof body.role !== "string" ||
    !(body.role in RANK)
  ) {
    return refuse("Faltan datos del usuario.", 400);
  }
  if (manager.role !== "superadmin" && RANK[body.role] > RANK[manager.role]) {
    return refuse("No puedes invitar a alguien con más permisos que los tuyos.");
  }
  if (manager.role !== "superadmin" && body.role === "superadmin") return refuse("No puedes crear superadministradores.");

  // La persona nueva queda a cargo de quien la invita (también si es superadministrador): él recibirá sus pull requests.
  // Si quien invita no es superadministrador, empieza solo mirando y por una semana.
  const starter: Access | undefined =
    manager.role === "superadmin"
      ? undefined
      : { scope: { pageIds: [], blockIds: [] }, denied: EVERYTHING_DENIED, expiresAt: new Date(Date.now() + WEEK_MS).toISOString() };

  try {
    const user = await createUser(body as NewUser, manager.id, starter);
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    return refuse(error instanceof Error ? error.message : "No se pudo crear el usuario.", 400);
  }
}

/** Cambia el acceso de una cuenta: `{ id, access }`. Nadie puede dar más de lo que tiene. */
export async function PATCH(request: Request) {
  if (!sameOriginRequest(request)) return notAllowed();
  const manager = await sharer();
  if (!manager) return refuse("No tienes permiso para compartir el proyecto.");

  const body = (await request.json().catch(() => null)) as { id?: unknown; access?: unknown } | null;
  const access = parseAccess(body?.access);
  if (typeof body?.id !== "string" || !access) return refuse("Faltan datos del acceso.", 400);
  if (body.id === manager.id || !(await manages(manager, body.id))) return refuse("No puedes cambiar el acceso de esta cuenta.");

  try {
    return Response.json({ user: await setAccess(body.id, access, manager.role === "superadmin" ? undefined : manager.id) });
  } catch (error) {
    return refuse(error instanceof Error ? error.message : "No se pudo guardar el acceso.", 400);
  }
}

export async function DELETE(request: Request) {
  if (!sameOriginRequest(request)) return notAllowed();
  const manager = await sharer();
  if (!manager) return refuse("No tienes permiso para compartir el proyecto.");

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return refuse("Falta el usuario que se quiere eliminar.", 400);
  if (id === manager.id) return refuse("No puedes eliminar tu propia cuenta.", 400);
  if (!(await manages(manager, id))) return refuse("No puedes eliminar esta cuenta.");

  try {
    await deleteUser(id);
    return Response.json({ ok: true });
  } catch (error) {
    return refuse(error instanceof Error ? error.message : "No se pudo eliminar el usuario.", 400);
  }
}
