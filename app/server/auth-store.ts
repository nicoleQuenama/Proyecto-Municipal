import { randomUUID } from "node:crypto";
import { combineAccess, isExpired, type Access } from "../components/auth/access";
import type { NewUser, User, UserRole } from "../components/auth/types";
import { readStore, toPublic, writeStore, type StoredUser } from "./auth-file";
import { hashPassword, newSalt, passwordMatches } from "./auth-passwords";
import { readPart } from "./project-store";

const ROLES: UserRole[] = ["superadmin", "dev", "designer"];
const MIN_PASSWORD_LENGTH = 8;

export async function listUsers(): Promise<User[]> {
  return (await readStore()).users.map(toPublic);
}

/** Las páginas y secciones del proyecto, para saber qué secciones caben en el alcance de cada persona. */
async function loadPages(): Promise<{ id: string; blocks: { id: string }[] }[]> {
  try {
    const site = JSON.parse((await readPart("site")) ?? "{}") as { pages?: { id: string; blocks?: { id: string }[] }[] };
    return (site.pages ?? []).map((page) => ({ id: page.id, blocks: page.blocks ?? [] }));
  } catch {
    return [];
  }
}

const MAX_CHAIN = 6;

/** Lo que vale hoy para una cuenta: si sigue activa y su acceso real (nunca más que el de quien la invitó). */
async function resolve(user: StoredUser, users: StoredUser[], depth = 0): Promise<{ active: boolean; access?: Access }> {
  if (isExpired(user.access)) return { active: false };
  if (!user.invitedBy) return { active: true, access: user.access };

  const owner = users.find((entry) => entry.id === user.invitedBy);
  if (!owner || depth > MAX_CHAIN) return { active: false };
  const above = await resolve(owner, users, depth + 1);
  if (!above.active) return { active: false };

  const needsPages = user.access?.scope && above.access?.scope;
  const access = combineAccess(user.access, above.access, needsPages ? await loadPages() : []);
  return { active: !isExpired(access), access };
}

const withAccess = (user: StoredUser, access: Access | undefined): User => ({ ...toPublic(user), access });

/** La cuenta de una sesión, con su acceso real; `null` si ya no existe o su acceso venció. */
export async function findUserById(id: string): Promise<User | null> {
  const store = await readStore();
  const stored = store.users.find((user) => user.id === id);
  if (!stored) return null;
  const { active, access } = await resolve(stored, store.users);
  return active ? withAccess(stored, access) : null;
}

export async function verifyCredentials(username: string, password: string): Promise<User | null> {
  const normalized = username.trim().toLowerCase();
  const store = await readStore();
  const stored = store.users.find((user) => user.username.toLowerCase() === normalized);
  if (!stored || !passwordMatches(password, stored.passwordHash, stored.salt)) return null;

  const { active, access } = await resolve(stored, store.users);
  if (!active) throw new Error("Tu acceso al proyecto ya venció o fue retirado. Pide a quien te invitó que lo renueve.");
  return withAccess(stored, access);
}

function validate(input: NewUser): { name: string; username: string; email: string } {
  const name = input.name.trim();
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();

  if (!name) throw new Error("El nombre es obligatorio.");
  if (username.length < 3) throw new Error("El usuario debe tener al menos 3 caracteres.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("El correo no es válido.");
  if (!ROLES.includes(input.role)) throw new Error("El rol no es válido.");
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }

  return { name, username, email };
}

export async function createUser(input: NewUser, invitedBy?: string, access?: Access): Promise<User> {
  const values = validate(input);
  const store = await readStore();

  if (store.users.some((user) => user.username.toLowerCase() === values.username.toLowerCase())) {
    throw new Error("Ya existe un usuario con ese nombre de usuario.");
  }
  if (store.users.some((user) => user.email.toLowerCase() === values.email)) {
    throw new Error("Ya existe un usuario con ese correo.");
  }

  const salt = newSalt();
  const stored = {
    id: `u-${randomUUID()}`,
    ...values,
    role: input.role,
    ...(invitedBy ? { invitedBy } : {}),
    ...(access ? { access } : {}),
    salt,
    passwordHash: hashPassword(input.password, salt),
  };

  store.users.push(stored);
  await writeStore(store);
  return toPublic(stored);
}

export async function deleteUser(id: string): Promise<void> {
  const store = await readStore();
  const user = store.users.find((entry) => entry.id === id);
  if (!user) throw new Error("El usuario no existe.");

  const superadmins = store.users.filter((entry) => entry.role === "superadmin").length;
  if (user.role === "superadmin" && superadmins <= 1) {
    throw new Error("No se puede eliminar al último superadministrador.");
  }

  // Quitar a alguien también retira a las personas que invitó.
  const gone = new Set([id]);
  for (let grew = true; grew; ) {
    const before = gone.size;
    store.users.filter((entry) => entry.invitedBy && gone.has(entry.invitedBy)).forEach((entry) => gone.add(entry.id));
    grew = gone.size > before;
  }
  store.users = store.users.filter((entry) => !gone.has(entry.id));
  await writeStore(store);
}

/** Guarda el acceso de una cuenta; si la da alguien que no es superadministrador, se recorta a lo que esa persona tiene. */
export async function setAccess(id: string, access: Access, grantedBy?: string): Promise<User> {
  const store = await readStore();
  const user = store.users.find((entry) => entry.id === id);
  if (!user) throw new Error("El usuario no existe.");
  if (user.role === "superadmin") throw new Error("El acceso de un superadministrador no se limita.");

  const giver = grantedBy ? store.users.find((entry) => entry.id === grantedBy) : undefined;
  const above = giver && giver.role !== "superadmin" ? (await resolve(giver, store.users)).access : undefined;
  user.access = above ? combineAccess(access, above, access.scope && above.scope ? await loadPages() : []) : access;
  await writeStore(store);
  return toPublic(user);
}

/** Las cuentas que una persona invitó (todas, si es superadministrador). */
export async function listManaged(managerId: string, all: boolean): Promise<User[]> {
  const users = (await readStore()).users;
  return users.filter((user) => (all || user.invitedBy === managerId)).map(toPublic);
}

export async function findStored(id: string): Promise<StoredUser | null> {
  return (await readStore()).users.find((user) => user.id === id) ?? null;
}
