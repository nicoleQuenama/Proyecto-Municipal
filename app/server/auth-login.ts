import { loadChain, resolveAccess, withRealAccess, type Actor } from "./auth-accounts";
import { pagesOf } from "./auth-members";
import { db, withOrg } from "./db";
import { NO_ACCOUNT_HASH, passwordMatches } from "./password-hash";

interface LoginRow {
  user_id: string;
  organization_id: string;
  password_hash: string;
}

/** La cuenta con su acceso real hoy, o `null` si ya no puede entrar (borrada, deshabilitada, vencida o sin quien la invitó). */
async function actorOf(orgId: string, userId: string, sessionVersion?: number): Promise<Actor | null> {
  const { chain, pages } = await withOrg(orgId, userId, async (tx) => {
    const accounts = await loadChain(tx, userId);
    // Cruzar dos alcances necesita saber qué secciones tiene cada página; solo se pide cuando hay dos alcances que cruzar.
    const crossing = accounts.length > 1 && accounts.some((account) => account.user.access?.scope);
    return { chain: accounts, pages: crossing ? await pagesOf(tx) : [] };
  });
  const own = chain[0];
  if (!own || (sessionVersion !== undefined && own.sessionVersion !== sessionVersion)) return null;

  const { active, access } = resolveAccess(chain, pages);
  return active ? { user: withRealAccess(own.user, access), orgId, sessionVersion: own.sessionVersion } : null;
}

/**
 * Entra con correo y contraseña. `null` si no coinciden. Lanza si la cuenta es correcta pero su acceso ya venció o fue
 * retirado. La búsqueda por correo es lo único que cruza organizaciones (función acotada de la base de datos).
 */
export async function verifyCredentials(email: string, password: string): Promise<Actor | null> {
  const [found] = await db()<LoginRow[]>`select user_id, organization_id, password_hash from app.login_lookup(${email.trim().toLowerCase()})`;
  const matches = await passwordMatches(password, found?.password_hash ?? NO_ACCOUNT_HASH);
  if (!found || !matches) return null;

  const actor = await actorOf(found.organization_id, found.user_id);
  if (!actor) throw new Error("Tu acceso al proyecto ya venció o fue retirado. Pide a quien te invitó que lo renueve.");

  await withOrg(actor.orgId, actor.user.id, (tx) => tx`update app.users set last_login_at = now() where id = ${actor.user.id}`);
  return actor;
}

/** La cuenta de una sesión abierta: `null` si la contraseña cambió desde entonces o su acceso terminó. */
export const findActor = (orgId: string, userId: string, sessionVersion: number): Promise<Actor | null> =>
  actorOf(orgId, userId, sessionVersion);
