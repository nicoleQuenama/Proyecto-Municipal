import { randomUUID } from "node:crypto";
import { readStore, writeStore } from "./auth-file";
import { hashPassword, newSalt } from "./auth-passwords";

/**
 * Reestablecimiento simulado (modo demostración): no hay correo vinculado,
 * así que solo se busca la cuenta por usuario y se devuelve una clave temporal.
 */
export async function recoverPassword(username: string): Promise<string> {
  const normalized = username.trim().toLowerCase();
  const store = await readStore();
  const user = store.users.find((entry) => entry.username.toLowerCase() === normalized);

  if (!user) throw new Error("No existe una cuenta con ese usuario.");

  const tempPassword = `Temp${randomUUID().slice(0, 8)}!`;
  const salt = newSalt();
  user.salt = salt;
  user.passwordHash = hashPassword(tempPassword, salt);
  await writeStore(store);
  return tempPassword;
}
