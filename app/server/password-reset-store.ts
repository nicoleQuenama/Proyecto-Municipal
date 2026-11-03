import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * Tokens de restablecimiento. No hay base de datos: se guardan en JSON.
 * En el archivo solo queda el hash del token, nunca el token en claro.
 */
const FILE = join(process.cwd(), ".cms-data", "password-resets.json");
const TTL_MS = 30 * 60 * 1000;

interface ResetRecord {
  userId: string;
  tokenHash: string;
  expiresAt: number;
  usedAt?: number;
}

const digest = (token: string) => createHash("sha256").update(token).digest("hex");

async function read(): Promise<ResetRecord[]> {
  try {
    const data = JSON.parse(await readFile(FILE, "utf8")) as ResetRecord[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function write(records: ResetRecord[]): Promise<void> {
  await mkdir(dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(records, null, 2));
}

// Crea un token nuevo e invalida los enlaces anteriores del mismo usuario. 
export async function issueResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const records = (await read()).filter((r) => r.userId !== userId && !r.usedAt && r.expiresAt > now);
  records.push({ userId, tokenHash: digest(token), expiresAt: now + TTL_MS });
  await write(records);
  return token;
}

// Marca como usado el token (un solo uso). 
export async function consumeResetToken(token: string): Promise<string | null> {
  const records = await read();
  const record = records.find((r) => r.tokenHash === digest(token));
  if (!record || record.usedAt || record.expiresAt < Date.now()) return null;
  record.usedAt = Date.now();
  await write(records);
  return record.userId;
}

/**
 * Límite simple en memoria: 3 solicitudes cada 15 minutos por IP + correo.
 * Se reinicia al reiniciar el servidor; suficiente mientras no haya base de datos.
 */
const attempts = new Map<string, number[]>();

export function allowResetAttempt(key: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((time) => now - time < 15 * 60 * 1000);
  if (recent.length >= 3) return false;
  attempts.set(key, [...recent, now]);
  return true;
}
