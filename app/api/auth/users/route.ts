import type { NewUser } from "../../../components/auth/types";
import { sessionUser } from "../../../server/auth-session";
import { createUser, deleteUser, listUsers } from "../../../server/auth-store";
import { sameOriginRequest } from "../../../server/proxy-guard";

async function manager() {
  const user = await sessionUser();
  return user?.role === "superadmin" ? user : null;
}

const forbidden = () => Response.json({ error: "No tienes permiso para gestionar usuarios." }, { status: 403 });

export async function GET(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "Petición no permitida." }, { status: 403 });
  if (!(await manager())) return forbidden();

  return Response.json({ users: await listUsers() });
}

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "Petición no permitida." }, { status: 403 });
  if (!(await manager())) return forbidden();

  const body = (await request.json().catch(() => null)) as Partial<NewUser> | null;
  if (
    !body ||
    typeof body.name !== "string" ||
    typeof body.username !== "string" ||
    typeof body.email !== "string" ||
    typeof body.password !== "string" ||
    typeof body.role !== "string"
  ) {
    return Response.json({ error: "Faltan datos del usuario." }, { status: 400 });
  }

  try {
    const user = await createUser(body as NewUser);
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo crear el usuario." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "Petición no permitida." }, { status: 403 });

  const current = await manager();
  if (!current) return forbidden();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Falta el usuario que se quiere eliminar." }, { status: 400 });
  if (id === current.id) return Response.json({ error: "No puedes eliminar tu propia cuenta." }, { status: 400 });

  try {
    await deleteUser(id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo eliminar el usuario." },
      { status: 400 },
    );
  }
}
