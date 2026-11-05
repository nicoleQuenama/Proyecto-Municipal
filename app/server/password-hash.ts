import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Hash completo y autodescriptivo: `scrypt$N$r$p$sal$hash`. La sal y los parámetros viajan con el hash, así que
 * se pueden endurecer más adelante sin migrar a nadie (cada cuenta se verifica con los parámetros con que se creó).
 * Esta unidad no importa nada del proyecto: también la usa el script de carga inicial (`scripts/db-seed.mts`).
 */
const scryptAsync = promisify(scrypt) as (password: string, salt: string, keylen: number, options: object) => Promise<Buffer>;

const COST = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 64;

const encode = (salt: string, hash: string) => `scrypt$${COST.N}$${COST.r}$${COST.p}$${salt}$${hash}`;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  return encode(salt, (await scryptAsync(password, salt, KEY_LENGTH, COST)).toString("hex"));
}

export async function passwordMatches(password: string, encoded: string): Promise<boolean> {
  const [scheme, n, r, p, salt, hash] = encoded.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const actual = await scryptAsync(password, salt, expected.length, { N: Number(n), r: Number(r), p: Number(p) });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Cuesta lo mismo que uno real: se compara contra esto cuando el correo no existe, para que el tiempo no delate qué cuentas hay. */
export const NO_ACCOUNT_HASH = encode("0".repeat(32), "0".repeat(KEY_LENGTH * 2));
