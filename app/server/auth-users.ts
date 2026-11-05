import { combineAccess, type Access } from "../components/auth/access";
import type { NewUser, User, UserRole } from "../components/auth/types";
import { loadAccount, loadAccounts, type Actor } from "./auth-accounts";
import { currentProject, pagesOf, saveMember } from "./auth-members";
import { assertPassword } from "./auth-password";
import { isPgError, withOrg } from "./db";
import { hashPassword } from "./password-hash";

const ROLES: UserRole[] = ["superadmin", "dev", "designer"];

function validate(input: NewUser): { name: string; username: string; email: string } {
  const name = input.name.trim();
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();

  if (!name) throw new Error("El nombre es obligatorio.");
  if (username.length < 3) throw new Error("El usuario debe tener al menos 3 caracteres.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("El correo no es válido.");
  if (!ROLES.includes(input.role)) throw new Error("El rol no es válido.");
  assertPassword(input.password);
  return { name, username, email };
}

/** Los textos de las restricciones de la base de datos, en el idioma de la persona. */
function friendly(error: unknown): Error {
  if (isPgError(error, "23505", "users_email_key")) return new Error("Ya existe un usuario con ese correo.");
  if (isPgError(error, "23505", "users_org_username_key")) return new Error("Ya existe un usuario con ese nombre de usuario.");
  if (isPgError(error, "23503")) return new Error("Alguna de las páginas o secciones asignadas ya no existe.");
  return error instanceof Error ? error : new Error("No se pudo completar la operación.");
}

/**
 * Crea una cuenta en la organización de quien la crea. Queda a cargo de quien la invita (recibirá sus pull requests),
 * salvo un superadministrador, que no depende de nadie. Todos los demás reciben su acceso al proyecto.
 */
export async function createUser(actor: Actor, input: NewUser, access?: Access): Promise<User> {
  const values = validate(input);
  const passwordHash = await hashPassword(input.password);

  try {
    return await withOrg(actor.orgId, actor.user.id, async (tx) => {
      const invitedBy = input.role === "superadmin" ? null : actor.user.id;
      const [row] = await tx<{ id: string }[]>`
        insert into app.users (organization_id, email, username, name, role, password_hash, invited_by)
        values (${actor.orgId}, ${values.email}, ${values.username}, ${values.name}, ${input.role}, ${passwordHash}, ${invitedBy})
        returning id`;
      if (input.role !== "superadmin") await saveMember(tx, actor, await currentProject(tx), row.id, access);
      return (await loadAccount(tx, row.id))!.user;
    });
  } catch (error) {
    throw friendly(error);
  }
}

/** Quita la cuenta y, con ella, a todas las personas que invitó. La base de datos impide quitar al último superadministrador. */
export async function deleteUser(actor: Actor, id: string): Promise<void> {
  try {
    await withOrg(actor.orgId, actor.user.id, async (tx) => {
      const removed = await tx`
        with recursive gone as (
          select id from app.users where id = ${id} and deleted_at is null
          union
          select u.id from app.users u join gone g on u.invited_by = g.id where u.deleted_at is null
        )
        update app.users set deleted_at = now() where id in (select id from gone) returning id`;
      if (removed.length === 0) throw new Error("El usuario no existe.");
    });
  } catch (error) {
    throw isPgError(error, "23514") ? new Error("No se puede eliminar al último superadministrador.") : friendly(error);
  }
}

/** Guarda el acceso de una cuenta; si lo da alguien que no es superadministrador, se recorta a lo que esa persona tiene. */
export async function setAccess(actor: Actor, id: string, access: Access): Promise<User> {
  try {
    return await withOrg(actor.orgId, actor.user.id, async (tx) => {
      const target = await loadAccount(tx, id);
      if (!target || target.removed) throw new Error("El usuario no existe.");
      if (target.user.role === "superadmin") throw new Error("El acceso de un superadministrador no se limita.");

      const above = actor.user.role === "superadmin" ? undefined : actor.user.access;
      await saveMember(tx, actor, await currentProject(tx), id, above ? combineAccess(access, above, await pagesOf(tx)) : access);
      return (await loadAccount(tx, id))!.user;
    });
  } catch (error) {
    throw friendly(error);
  }
}

/** Las cuentas que una persona invitó (todas, si es superadministrador). */
export async function listManaged(actor: Actor, all: boolean): Promise<User[]> {
  const accounts = await withOrg(actor.orgId, actor.user.id, (tx) =>
    loadAccounts(tx, all ? tx`` : tx`and u.invited_by = ${actor.user.id}`),
  );
  return accounts.map((account) => account.user);
}

/** Una cuenta de la organización, o `null` si no existe. */
export async function findUser(actor: Actor, id: string): Promise<User | null> {
  const account = await withOrg(actor.orgId, actor.user.id, (tx) => loadAccount(tx, id));
  return account && !account.removed ? account.user : null;
}
