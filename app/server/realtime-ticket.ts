import { createHmac } from "node:crypto";

const TTL_MS = 60_000;

function secret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production") throw new Error("Falta AUTH_SECRET.");
  return "portal-desarrollo-cambia-esta-clave";
}

export interface TicketInput {
  uid: string;
  name: string;
  org: string;
  project: string;
  /** Puede cambiar el diseño (y por tanto enviar lo que edita en vivo); si no, solo mira y se le ve. */
  canEdit: boolean;
}

/**
 * El boleto con el que el navegador entra al servidor de tiempo real: dura un minuto y va firmado con AUTH_SECRET
 * (con un prefijo propio, para que no valga como cookie de sesión). Lo verifica `realtime/server.mts`.
 */
export function signRealtimeTicket(input: TicketInput): string {
  const payload = Buffer.from(JSON.stringify({ ...input, exp: Date.now() + TTL_MS })).toString("base64url");
  return `${payload}.${createHmac("sha256", secret()).update(`realtime:${payload}`).digest("base64url")}`;
}
