import { sameOriginRequest } from "../../../server/proxy-guard";
import { sessionUser } from "../../../server/auth-session";
import { findStored, resetPassword } from "../../../server/auth-store";
import { sendTemporaryPasswordEmail } from "../../../server/mail";

const refuse = (error: string, status = 403) => Response.json({ error }, { status });

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "Petición no permitida." }, { status: 403 });
  
  const manager = await sessionUser();
  if (!manager) return Response.json({ error: "No autenticado." }, { status: 401 });
  if (manager.role !== "superadmin") return refuse("Solo el superadministrador puede restablecer contraseñas.");

  const body = (await request.json().catch(() => null)) as { userId?: string } | null;
  if (!body?.userId) return refuse("Falta el usuario.");

  try {
    const tempPassword = await resetPassword(body.userId);

    // La contraseña temporal solo se envía al correo de la cuenta, nunca al cliente.
    const target = await findStored(body.userId);
    if (target) await sendTemporaryPasswordEmail(target.email, target.name, tempPassword);

    return Response.json({ ok: true });
  } catch (error) {
    return refuse(error instanceof Error ? error.message : "No se pudo restablecer la contraseña.", 400);
  }
}
