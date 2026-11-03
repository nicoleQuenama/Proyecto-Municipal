import { sameOriginRequest } from "../../../server/proxy-guard";
import { sessionUser, startSession } from "../../../server/auth-session";
import { changePassword } from "../../../server/auth-store";
import { sendPasswordChangedEmail } from "../../../server/mail";

const refuse = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "Petición no permitida." }, { status: 403 });
  
  const user = await sessionUser();
  if (!user) return Response.json({ error: "No autenticado." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { currentPassword?: string; newPassword?: string } | null;
  if (!body?.currentPassword || !body?.newPassword) {
    return refuse("Faltan datos.");
  }

  try {
    await changePassword(user.id, body.currentPassword, body.newPassword);

    // La contraseña cambió y sessionVersion subió: renovamos solo esta sesión
    // para no expulsar a quien hizo el cambio, y avisamos por correo.
    await startSession(user.id);
    await sendPasswordChangedEmail(user.email, user.name);
    return Response.json({ ok: true });
  } catch (error) {
    return refuse(error instanceof Error ? error.message : "No se pudo cambiar la contraseña.");
  }
}
