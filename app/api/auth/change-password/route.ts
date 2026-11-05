import { sameOriginRequest } from "../../../server/proxy-guard";
import { sessionActor, startSession } from "../../../server/auth-session";
import { changePassword } from "../../../server/auth-password";
import { sendPasswordChangedEmail } from "../../../server/mail";

const refuse = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return refuse("Petición no permitida.", 403);

  const actor = await sessionActor();
  if (!actor) return refuse("No autenticado.", 401);

  const body = (await request.json().catch(() => null)) as { currentPassword?: string; newPassword?: string } | null;
  if (!body?.currentPassword || !body?.newPassword) return refuse("Faltan datos.");

  try {
    const sessionVersion = await changePassword(actor, body.currentPassword, body.newPassword);

    // La contraseña cambió y la versión de sesión subió: renovamos solo esta sesión
    // para no expulsar a quien hizo el cambio, y avisamos por correo.
    await startSession({ ...actor, sessionVersion });
    await sendPasswordChangedEmail(actor.user.email, actor.user.name);
    return Response.json({ ok: true });
  } catch (error) {
    return refuse(error instanceof Error ? error.message : "No se pudo cambiar la contraseña.");
  }
}
