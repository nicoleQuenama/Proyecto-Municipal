import { findUserByIdentity } from "../../../server/auth-password";
import { sendPasswordResetEmail } from "../../../server/mail";
import { allowResetAttempt, issueResetToken } from "../../../server/password-reset-store";
import { sameOriginRequest } from "../../../server/proxy-guard";

/*verificacion de que los correos existan*/
const generic = () =>
  Response.json({ ok: true, message: "Si el usuario y el correo coinciden, enviamos un enlace." }, { status: 202 });

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "Petición no permitida." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { username?: string; email?: string } | null;
  const username = body?.username?.trim();
  const email = body?.email?.trim().toLowerCase();
  if (!username || !email) return Response.json({ error: "Indica tu usuario y tu correo." }, { status: 400 });

  // Límite por IP + usuario + correo para evitar spam de enlaces.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allowResetAttempt(`${ip}:${username}:${email}`)) return generic();

  const user = await findUserByIdentity(username, email);
  if (user) {
    try {
      const token = await issueResetToken(user.id);
      await sendPasswordResetEmail(user.email, user.name, token);
    } catch (error) {
      console.error("[auth] no se pudo enviar el enlace de restablecimiento", error);
    }
  }

  return generic();
}
