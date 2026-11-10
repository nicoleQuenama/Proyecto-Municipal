import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production") throw new Error("Falta AUTH_SECRET.");
  return "portal-desarrollo-cambia-esta-clave";
}

export interface Ticket {
  uid: string;
  name: string;
  org: string;
  project: string;
  canEdit: boolean;
  /** Las unidades de la persona y si es superadministrador de una organización con unidades (ver units.mts). */
  units: string[];
  all: boolean;
  exp: number;
}

/** El boleto es `payload.firma` (HMAC-SHA256 con prefijo propio, para que no valga como cookie de sesión). */
export function readTicket(raw: string): Ticket | null {
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", secret()).update(`realtime:${payload}`).digest("base64url");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<Ticket>;
    if (typeof data.uid !== "string" || typeof data.org !== "string" || typeof data.project !== "string" || typeof data.name !== "string") return null;
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return { uid: data.uid, name: data.name.slice(0, 80), org: data.org, project: data.project, canEdit: data.canEdit === true, units: Array.isArray(data.units) ? data.units.filter((unit): unit is string => typeof unit === "string").slice(0, 50) : [], all: data.all === true, exp: data.exp };
  } catch {
    return null;
  }
}
