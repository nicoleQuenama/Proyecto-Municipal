import { assertPassword, setPassword } from "../../../server/auth-password";
import { findStored } from "../../../server/auth-store";
import { sendPasswordChangedEmail } from "../../../server/mail";
import { consumeResetToken } from "../../../server/password-reset-store";
import { sameOriginRequest } from "../../../server/proxy-guard";

const refuse = (error: string, status = 400) => Response.json({ error }, { status });

/** El usuario vuelve desde el correo con el token. */
export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return refuse("Petición no permitida.", 403);

  const body = (await request.json().catch(() => null)) as { token?: string; password?: string } | null;
  if (!body?.token || !body.password) return refuse("Faltan datos.");
  try {
    assertPassword(body.password);
  } catch (error) {
    return refuse(error instanceof Error ? error.message : "La contraseña no es válida.");
  }

  // Consume el token antes de tocar la contraseña: si ya se usó o venció, no se cambia nada.
  const userId = await consumeResetToken(body.token);
  if (!userId) return refuse("El enlace no es válido, ya se usó o venció.");

  const stored = await findStored(userId);
  if (!stored) return refuse("El usuario no existe.");

  try {
    await setPassword(userId, body.password);
    await sendPasswordChangedEmail(stored.email, stored.name);
    return Response.json({ ok: true });
  } catch (error) {
    return refuse(error instanceof Error ? error.message : "No se pudo cambiar la contraseña.", 500);
  }
}
