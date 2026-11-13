import { isMailConfigured, sendPasswordResetEmail } from "../../../server/mail";
import { findByIdentity, issueResetToken } from "../../../server/password-reset-store";
import { sameOriginRequest } from "../../../server/proxy-guard";
import { allowResetAttempt } from "../../../server/reset-rate-limit";

/* La respuesta es la misma exista o no la cuenta: no se puede averiguar qué correos están registrados. */
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

  try {
    const account = await findByIdentity(username, email);
    // Si la cuenta existe pero el SMTP no está configurado no se crea el token:
    // el enlace no podría llegar y solo quedarían registros basura. La respuesta
    // sigue siendo genérica para no revelar qué correos están registrados.
    if (account && !isMailConfigured()) {
      console.error("[auth] no se envió el enlace de restablecimiento: el correo SMTP no está configurado");
    } else if (account) {
      await sendPasswordResetEmail(account.email, account.name, await issueResetToken(account, ip));
    }
  } catch (error) {
    console.error("[auth] no se pudo enviar el enlace de restablecimiento", error);
  }

  return generic();
}
