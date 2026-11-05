import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Cifrado de lo que no debe quedar legible en la base de datos (las cabeceras de las APIs pueden llevar claves).
 * AES-256-GCM con una clave que vive en el servidor (DATA_KEY), nunca en la base de datos: un volcado no las revela.
 * Formato: 12 bytes de IV + 16 de etiqueta + el texto cifrado.
 */
function key(): Buffer {
  const secret = process.env.DATA_KEY;
  if (!secret && process.env.NODE_ENV === "production") throw new Error("Falta DATA_KEY: sin ella los secretos no se pueden guardar de forma segura.");
  return createHash("sha256").update(secret ?? "portal-desarrollo-clave-de-datos").digest();
}

export function encryptJson(value: unknown): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]);
}

export function decryptJson(data: Buffer): unknown {
  const decipher = createDecipheriv("aes-256-gcm", key(), data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  return JSON.parse(Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString("utf8"));
}
