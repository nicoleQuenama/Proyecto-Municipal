import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { User } from "../components/auth/types";
import type { Actor } from "./auth-accounts";
import { findActor } from "./auth-login";

export const SESSION_COOKIE = "portal_session";

const MAX_AGE = 60 * 60 * 24 * 7;

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") throw new Error("Falta AUTH_SECRET: sin ella las sesiones no son seguras.");
  return "portal-desarrollo-cambia-esta-clave";
}

const sign = (payload: string): string => createHmac("sha256", secret()).update(payload).digest("base64url");

interface Claims {
  sub: string;
  org: string;
  sv: number;
}

/** `sv` es la versión de sesión: si cambia la contraseña, el token deja de valer. */
function createToken({ user, orgId, sessionVersion }: Actor): string {
  const payload = Buffer.from(JSON.stringify({ sub: user.id, org: orgId, exp: Date.now() + MAX_AGE * 1000, sv: sessionVersion })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readToken(token: string): Claims | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const actual = Buffer.from(signature);
  const expected = Buffer.from(sign(payload));
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<Claims & { exp: number }>;
    if (typeof data.sub !== "string" || typeof data.org !== "string" || typeof data.sv !== "number") return null;
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return { sub: data.sub, org: data.org, sv: data.sv };
  } catch {
    return null;
  }
}

export async function startSession(actor: Actor): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, createToken(actor), {
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

/** Quien tiene la sesión abierta, con su organización; `null` si no hay sesión, si cambió su contraseña o si perdió el acceso. */
export async function sessionActor(): Promise<Actor | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const claims = token ? readToken(token) : null;
  return claims ? findActor(claims.org, claims.sub, claims.sv) : null;
}

export async function sessionUser(): Promise<User | null> {
  return (await sessionActor())?.user ?? null;
}
