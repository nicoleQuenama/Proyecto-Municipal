import { passwordIssues } from "../components/auth/password-rules";
import type { User } from "../components/auth/types";
import { readStore, toPublic, writeStore } from "./auth-file";
import { hashPassword, newSalt } from "./auth-passwords";

/** Mismas reglas que muestra el formulario; el servidor no confía en el cliente. */
export function assertPassword(password: string): void {
  const missing = passwordIssues(password);
  if (missing.length) throw new Error(`La contraseña debe cumplir: ${missing.join(", ")}.`);
}

/** El usuario y el correo deben coincidir: dos pruebas antes de enviar el enlace. */
export async function findUserByIdentity(username: string, email: string): Promise<User | null> {
  const user = username.trim().toLowerCase();
  const mail = email.trim().toLowerCase();
  const stored = (await readStore()).users.find(
    (entry) => entry.username.toLowerCase() === user && entry.email.toLowerCase() === mail,
  );
  return stored ? toPublic(stored) : null;
}

/**
 * Guarda la contraseña nueva y sube `sessionVersion`.
 * Al subir la versión, todas las sesiones abiertas dejan de ser válidas.
 */
export async function setPassword(userId: string, password: string): Promise<void> {
  const store = await readStore();
  const user = store.users.find((entry) => entry.id === userId);
  if (!user) throw new Error("El usuario no existe.");

  const salt = newSalt();
  user.salt = salt;
  user.passwordHash = hashPassword(password, salt);
  user.sessionVersion = (user.sessionVersion ?? 0) + 1;
  await writeStore(store);
}
