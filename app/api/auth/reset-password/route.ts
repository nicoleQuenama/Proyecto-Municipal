import { sameOriginRequest } from "../../../server/proxy-guard";
import { sessionActor } from "../../../server/auth-session";
import { resetPassword } from "../../../server/auth-password";
import { sendTemporaryPasswordEmail, verifyMail } from "../../../server/mail";

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
    // Si el correo no funciona, la contraseña quedaría cambiada pero nadie la recibiría:
    // por eso se comprueba la conexión SMTP ANTES de tocar la cuenta.
    const mail = await verifyMail();
    if (!mail.ok) {
      return refuse(`No se puede enviar el correo: ${mail.error}`, 503);
    }

    const { user, password } = await resetPassword(manager, body.userId);
    // Si el envío falla justo después de verificar (caída puntual), se avisa en vez
    // de responder un falso éxito: la contraseña ya cambió y el usuario debe saberlo.
    const sent = await sendTemporaryPasswordEmail(user.email, user.name, password);
    if (!sent) {
      return refuse("La contraseña se restableció, pero el correo no se pudo enviar. Revisa la configuración SMTP.", 502);
    }
    return Response.json({ ok: true });
  } catch (error) {
    return refuse(error instanceof Error ? error.message : "No se pudo restablecer la contraseña.", 400);
  }
}
