import { sameOriginRequest } from "../../../server/proxy-guard";
import { recoverPassword } from "../../../server/auth-recovery";

const refuse = (error: string, status = 400) => Response.json({ error }, { status });

/** Restablecimiento simulado desde el login: no hay correo, se devuelve la clave en pantalla. */
export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return refuse("Petición no permitida.", 403);

  const body = (await request.json().catch(() => null)) as { username?: string } | null;
  if (!body?.username?.trim()) return refuse("Indica tu usuario.");

  try {
    const tempPassword = await recoverPassword(body.username);
    return Response.json({ ok: true, tempPassword });
  } catch (error) {
    return refuse(error instanceof Error ? error.message : "No se pudo restablecer la contraseña.");
  }
}
