import { randomUUID } from "node:crypto";
import { passwordIssues } from "../components/auth/password-rules";
import type { User } from "../components/auth/types";
import { loadAccount, type Actor } from "./auth-accounts";
import { withOrg } from "./db";
import { hashPassword, passwordMatches } from "./password-hash";

/** Mismas reglas que muestra el formulario; el servidor no confía en el cliente. */
export function assertPassword(password: string): void {
  const missing = passwordIssues(password);
  if (missing.length) throw new Error(`La contraseña debe cumplir: ${missing.join(", ")}.`);
}

/**
 * Cambia la contraseña de quien tiene la sesión. Sube la versión de sesión: las demás sesiones abiertas dejan de valer.
 * Devuelve la versión nueva para renovar solo esta sesión.
 */
export async function changePassword(actor: Actor, currentPassword: string, newPassword: string): Promise<number> {
  assertPassword(newPassword);
  const newHash = await hashPassword(newPassword);

  return withOrg(actor.orgId, actor.user.id, async (tx) => {
    const [row] = await tx<{ password_hash: string }[]>`select password_hash from app.users where id = ${actor.user.id}`;
    if (!row || !(await passwordMatches(currentPassword, row.password_hash))) throw new Error("La contraseña actual es incorrecta.");

    const [updated] = await tx<{ session_version: number }[]>`
      update app.users set password_hash = ${newHash}, session_version = session_version + 1
      where id = ${actor.user.id} returning session_version`;
    return updated.session_version;
  });
}

/**
 * Un superadministrador le pone una contraseña temporal a una cuenta (también cierra sus sesiones).
 * Devuelve la cuenta y la contraseña: solo se envía al correo de esa persona, nunca al navegador.
 */
export async function resetPassword(actor: Actor, id: string): Promise<{ user: User; password: string }> {
  const password = `Temp${randomUUID().slice(0, 8)}!`;
  const passwordHash = await hashPassword(password);

  return withOrg(actor.orgId, actor.user.id, async (tx) => {
    const account = await loadAccount(tx, id);
    if (!account || account.removed) throw new Error("El usuario no existe.");
    await tx`update app.users set password_hash = ${passwordHash}, session_version = session_version + 1 where id = ${id}`;
    return { user: account.user, password };
  });
}
