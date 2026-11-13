import nodemailer, { type Transporter } from "nodemailer";

// Módulo exclusivo del servidor: nunca importarlo desde un componente "use client".
// Las credenciales SMTP solo viven en variables de entorno y no se envían al navegador.

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

// ───────────────────────── Configuración SMTP ─────────────────────────
// Cambia estos valores en .env.local (ver .env.example). Sin SMTP_HOST el correo se omite
// y la app sigue funcionando (útil en desarrollo local).
const smtpHost = process.env.SMTP_HOST?.trim();
const smtpPort = (() => {
  const value = Number(process.env.SMTP_PORT ?? (process.env.SMTP_SECURE === "true" ? 465 : 587));
  return Number.isInteger(value) && value > 0 && value <= 65535 ? value : 587;
})();
// secure = conexión TLS directa (puerto 465). En 587 se usa STARTTLS.
// No desactives la verificación del certificado (rejectUnauthorized) en producción.
const smtpSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : smtpPort === 465;
const smtpUser = process.env.SMTP_USER?.trim();
// Gmail muestra la contraseña de aplicación en grupos de 4 y a veces se pega con espacios.
// Se quitan los espacios para que la autenticación funcione también en ese caso.
const smtpPass = process.env.SMTP_PASS?.trim().replace(/\s+/g, "");
const from = process.env.SMTP_FROM?.trim() || "Portal <no-reply@localhost>";

// Si hay usuario pero no contraseña (o al revés) el servidor SMTP responde
// "530 Authentication Required" / "535 Authentication failed". Es un error de
// configuración: mejor detectarlo aquí que esperar la respuesta del servidor.
const smtpMisconfigured = Boolean(smtpHost) && Boolean(smtpUser) !== Boolean(smtpPass);

// Un solo transportador por proceso, aunque Next recargue los módulos en desarrollo.
// La clave incluye la configuración para recrearlo si cambian las variables de entorno
// sin reiniciar el proceso (así no se queda cacheado un transportador sin credenciales).
const shared = globalThis as unknown as {
  portalMailer?: Transporter | null;
  portalMailerKey?: string;
};
const mailerKey = JSON.stringify([smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, from]);

/** `true` cuando hay servidor SMTP y credenciales completas (o un relay sin autenticación). */
export function isMailConfigured(): boolean {
  return Boolean(smtpHost) && !smtpMisconfigured;
}

/** Crea (o reutiliza) el transportador SMTP según la configuración actual. */
function mailer(): Transporter | null {
  if (shared.portalMailer !== undefined && shared.portalMailerKey === mailerKey) return shared.portalMailer;
  shared.portalMailerKey = mailerKey;
  if (!smtpHost) {
    shared.portalMailer = null;
    return null;
  }
  if (smtpMisconfigured) {
    console.error(
      "[mail] Configuración SMTP incompleta: SMTP_USER y SMTP_PASS deben definirse juntos. " +
        (smtpUser ? "Falta SMTP_PASS (en Gmail, una contraseña de aplicación)." : "Falta SMTP_USER."),
    );
    shared.portalMailer = null;
    return null;
  }
  shared.portalMailer = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    // Solo se autentica si hay usuario y contraseña; si no, se conecta sin auth.
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    // Verificación TLS explícita: no heredar NODE_TLS_REJECT_UNAUTHORIZED=0 del entorno
    // (ese flag global se usa en local por el escaneo SSL de Sophos).
    tls: { rejectUnauthorized: true, servername: smtpHost },
    // Evita que una petición quede colgada si el servidor SMTP no responde.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return shared.portalMailer;
}

/** Comprueba la conexión y las credenciales antes de una operación crítica (p. ej. una contraseña temporal). */
export async function verifyMail(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!smtpHost) return { ok: false, error: "Falta SMTP_HOST en la configuración." };
  if (smtpMisconfigured) {
    return {
      ok: false,
      error: smtpUser
        ? "Falta SMTP_PASS (en Gmail, una contraseña de aplicación de 16 caracteres)."
        : "Falta SMTP_USER en la configuración.",
    };
  }
  const transport = mailer();
  if (!transport) return { ok: false, error: "No se pudo crear el transportador SMTP." };
  try {
    await transport.verify();
    return { ok: true };
  } catch (error) {
    // No se registran credenciales ni el contenido del correo.
    const message = error instanceof Error ? error.message : String(error);
    console.error("[mail] La conexión SMTP falló:", message);
    return { ok: false, error: message };
  }
}

/** Devuelve `true` solo si el correo llegó a entregarse al servidor SMTP. */
async function send(to: string, subject: string, html: string): Promise<boolean> {
  const transport = mailer();
  if (!transport) {
    console.warn("[mail] El correo no está configurado: se omite el envío a", to);
    return false;
  }
  // Defensa contra inyección de cabeceras: ningún dato debe contener saltos de línea.
  if (/[\r\n]/.test(to) || /[\r\n]/.test(subject)) {
    console.error("[mail] Destinatario o asunto no válidos; se omite el envío.");
    return false;
  }
  try {
    const info = await transport.sendMail({ from, to, subject, html });
    if (info.rejected?.length) {
      console.error("[mail] El servidor SMTP rechazó destinatarios:", info.rejected);
      return false;
    }
    return true;
  } catch (error) {
    // No se registran credenciales ni el contenido del correo.
    console.error("[mail] No se pudo enviar el correo:", error instanceof Error ? error.message : error);
    return false;
  }
}

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

//Enlace de un solo uso para elegir una contraseña nueva.
export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<boolean> {
  const link = `${appUrl}/restablecer?token=${encodeURIComponent(token)}`;
  return send(
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
export async function sendTemporaryPasswordEmail(to: string, name: string, password: string): Promise<boolean> {
  return send(
    to,
    "Tu contraseña temporal del portal",
    `<p>Hola ${escape(name)},</p>
     <p>Un administrador restableció tu contraseña. Esta es tu contraseña temporal:</p>
     <p style="font-family:monospace;font-size:16px;background:#f3f4f6;padding:8px 12px;border-radius:6px;">${escape(password)}</p>
     <p>Inicia sesión y cámbiala desde tu perfil lo antes posible.</p>`,
  );
}

//aviso despues de cambio de contrasena
export async function sendPasswordChangedEmail(to: string, name: string): Promise<boolean> {
  return send(
    to,
    "Tu contraseña cambió",
    `<p>Hola ${escape(name)},</p>
     <p>Tu contraseña se actualizó correctamente.</p>
     <p>Si no reconoces este cambio, contacta al administrador del portal.</p>`,
  );
}
