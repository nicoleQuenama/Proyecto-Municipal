import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { User } from "../components/auth/types";
import { findStored, findUserById } from "./auth-store";

export const SESSION_COOKIE = "portal_session";

const MAX_AGE = 60 * 60 * 24 * 7;
const SECRET = process.env.AUTH_SECRET ?? "portal-desarrollo-cambia-esta-clave";

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

/** `sv` es la versión de sesión: si cambia la contraseña, el token deja de valer. */
function createToken(userId: string, sessionVersion: number): string {
  const payload = Buffer.from(
    JSON.stringify({ sub: userId, exp: Date.now() + MAX_AGE * 1000, sv: sessionVersion }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readToken(token: string): { sub: string; sv: number } | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const actual = Buffer.from(signature);
  const expected = Buffer.from(sign(payload));
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sub?: unknown;
      exp?: unknown;
      sv?: unknown;
    };
    if (typeof data.sub !== "string" || typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return { sub: data.sub, sv: typeof data.sv === "number" ? data.sv : 0 };
  } catch {
    return null;
  }
}

export async function startSession(userId: string): Promise<void> {
  const jar = await cookies();
  const stored = await findStored(userId);
  jar.set(SESSION_COOKIE, createToken(userId, stored?.sessionVersion ?? 0), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function sessionUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const data = readToken(token);
  if (!data) return null;

  // Si la contraseña cambió, sessionVersion ya no coincide y la sesión caduca.
  const stored = await findStored(data.sub);
  if (!stored || (stored.sessionVersion ?? 0) !== data.sv) return null;
  return findUserById(data.sub);
}
