import { assertPassword } from "../../../server/auth-password";
import { sendPasswordChangedEmail } from "../../../server/mail";
import { resetWithToken } from "../../../server/password-reset-store";
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

  try {
    // El token se gasta y la contraseña cambia en un solo paso: si ya se usó o venció, no se cambia nada.
    const changed = await resetWithToken(body.token, body.password);
    if (!changed) return refuse("El enlace no es válido, ya se usó o venció.");

    await sendPasswordChangedEmail(changed.email, changed.name);
    return Response.json({ ok: true });
  } catch (error) {
    return refuse(error instanceof Error ? error.message : "No se pudo cambiar la contraseña.", 500);
  }
}
