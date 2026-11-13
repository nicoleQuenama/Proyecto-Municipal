// Comprueba que el SMTP configurado en .env.local conecta y autentica.
// Uso: pnpm mail:test
// Devuelve código 1 si falta configuración o si Google rechaza las credenciales.
// Nunca imprime la contraseña ni el contenido de los correos.
import { isMailConfigured, verifyMail } from "../app/server/mail.ts";

if (!isMailConfigured()) {
  console.error("El correo no está configurado. Revisa SMTP_HOST, SMTP_USER y SMTP_PASS en .env.local.");
  process.exitCode = 1;
} else {
  const result = await verifyMail();
  if (result.ok) {
    console.log("SMTP correcto: conexión y credenciales válidas.");
  } else {
    console.error("SMTP con problemas:", result.error);
    process.exitCode = 1;
  }
}
