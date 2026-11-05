import { sameOriginRequest } from "../../../server/proxy-guard";
import { sessionActor } from "../../../server/auth-session";
import { resetPassword } from "../../../server/auth-password";
import { sendTemporaryPasswordEmail } from "../../../server/mail";

const refuse = (error: string, status = 403) => Response.json({ error }, { status });

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return refuse("Petición no permitida.");

  const manager = await sessionActor();
  if (!manager) return refuse("No autenticado.", 401);
  if (manager.user.role !== "superadmin") return refuse("Solo el superadministrador puede restablecer contraseñas.");

  const body = (await request.json().catch(() => null)) as { userId?: string } | null;
  if (!body?.userId) return refuse("Falta el usuario.");

  try {
    // La contraseña temporal solo se envía al correo de la cuenta, nunca al cliente.
    const { user, password } = await resetPassword(manager, body.userId);
    await sendTemporaryPasswordEmail(user.email, user.name, password);
    return Response.json({ ok: true });
  } catch (error) {
    return refuse(error instanceof Error ? error.message : "No se pudo restablecer la contraseña.", 400);
  }
}
