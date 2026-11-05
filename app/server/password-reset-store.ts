import { createHash, randomBytes } from "node:crypto";
import { isIP } from "node:net";
import { db, withOrg } from "./db";
import { hashPassword } from "./password-hash";

/**
 * Enlaces de restablecimiento. En la base de datos solo queda el SHA-256 del token, nunca el token en claro;
 * es de un solo uso y vence en 30 minutos.
 */
const digest = (token: string): Buffer => createHash("sha256").update(token).digest();

interface IdentityRow {
  user_id: string;
  organization_id: string;
  username: string;
  email: string;
  name: string;
}

/** La cuenta cuyo correo Y usuario coinciden (dos pruebas antes de enviar el enlace); si no, `null`. */
export async function findByIdentity(username: string, email: string): Promise<IdentityRow | null> {
  const [found] = await db()<IdentityRow[]>`
    select user_id, organization_id, username, email, name from app.login_lookup(${email.trim().toLowerCase()})`;
  return found && found.username.toLowerCase() === username.trim().toLowerCase() ? found : null;
}

/** Crea un enlace nuevo e invalida los anteriores de la misma cuenta. Devuelve el token (solo existe aquí y en el correo). */
export async function issueResetToken(account: IdentityRow, requestIp: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await withOrg(account.organization_id, null, async (tx) => {
    await tx`delete from app.password_reset_tokens where user_id = ${account.user_id} and used_at is null`;
    await tx`
      insert into app.password_reset_tokens (organization_id, user_id, token_hash, expires_at, requested_ip)
      values (${account.organization_id}, ${account.user_id}, ${digest(token)}, now() + interval '30 minutes', ${isIP(requestIp) ? requestIp : null})`;
  });
  return token;
}

/**
 * Gasta el token y guarda la contraseña nueva en un solo paso (atómico: un enlace no se puede usar dos veces).
 * Devuelve a quién se le cambió, o `null` si el enlace no vale, ya se usó o venció.
 */
export async function resetWithToken(token: string, password: string): Promise<{ email: string; name: string } | null> {
  const [changed] = await db()<{ email: string; name: string }[]>`
    select email, name from app.reset_password_with_token(${digest(token)}, ${await hashPassword(password)})`;
  return changed ?? null;
}
