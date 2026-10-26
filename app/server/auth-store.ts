import { randomUUID } from "node:crypto";
import type { NewUser, User, UserRole } from "../components/auth/types";
import { readStore, toPublic, writeStore } from "./auth-file";
import { hashPassword, newSalt, passwordMatches } from "./auth-passwords";

const ROLES: UserRole[] = ["superadmin", "dev", "designer"];
const MIN_PASSWORD_LENGTH = 8;

export async function listUsers(): Promise<User[]> {
  return (await readStore()).users.map(toPublic);
}

export async function findUserById(id: string): Promise<User | null> {
  const stored = (await readStore()).users.find((user) => user.id === id);
  return stored ? toPublic(stored) : null;
}

export async function verifyCredentials(username: string, password: string): Promise<User | null> {
  const normalized = username.trim().toLowerCase();
  const stored = (await readStore()).users.find((user) => user.username.toLowerCase() === normalized);
  if (!stored || !passwordMatches(password, stored.passwordHash, stored.salt)) return null;
  return toPublic(stored);
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

export async function createUser(input: NewUser): Promise<User> {
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

  store.users = store.users.filter((entry) => entry.id !== id);
  await writeStore(store);
}
