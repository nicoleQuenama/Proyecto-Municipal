import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM ?? "Portal <onboarding@resend.dev>";
const appUrl = process.env.APP_URL ?? "http://localhost:3000";

const resend = apiKey ? new Resend(apiKey) : null;

//vemos los errores
async function send(to: string, subject: string, html: string): Promise<void> {
  if (!resend) {
    console.warn("[mail] Falta RESEND_API_KEY: se omite el correo a", to);
    return;
  }
  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) console.error("[mail] Resend rechazó el envío:", error.message);
}

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

//Enlace de un solo uso para elegir una contraseña nueva.
export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${appUrl}/restablecer?token=${encodeURIComponent(token)}`;
  await send(
    to,
    "Restablece tu contraseña",
    `<p>Hola ${escape(name)},</p>
     <p>Recibimos una solicitud para restablecer tu contraseña, para poder realizar el cambio, sigue los siguientes pasos.</p>
     <p><a href="${link}">Crear una contraseña nueva</a></p>
     <p>El enlace es valido durante 30 minutos y solo puede usarse una vez.</p>
     <p>Si no fuiste tú, ignora este mensaje o comunicate con algun encargado.</p>`,
  );
}

//contrasena temporal generada por un superadministrador
export async function sendTemporaryPasswordEmail(to: string, name: string, password: string): Promise<void> {
  await send(
    to,
    "Tu contraseña temporal del portal",
    `<p>Hola ${escape(name)},</p>
     <p>Un administrador restableció tu contraseña. Esta es tu contraseña temporal:</p>
     <p style="font-family:monospace;font-size:16px;background:#f3f4f6;padding:8px 12px;border-radius:6px;">${escape(password)}</p>
     <p>Inicia sesión y cámbiala desde tu perfil lo antes posible.</p>`,
  );
}

//aviso despues de cambio de contrasena
export async function sendPasswordChangedEmail(to: string, name: string): Promise<void> {
  await send(
    to,
    "Tu contraseña cambió",
    `<p>Hola ${escape(name)},</p>
     <p>Tu contraseña se actualizó correctamente.</p>
     <p>Si no reconoces este cambio, contacta al administrador del portal.</p>`,
  );
}
