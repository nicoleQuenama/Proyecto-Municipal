import { REQUEST_HEADER } from "../../server/request-header";

/** Lo que responde GET /api/libs. */
export interface LibsStatus {
  /** ¿Se puede instalar con pnpm desde esta página? */
  available: boolean;
  reason?: string;
  installed: { name: string; version: string }[];
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { ...init?.headers, [REQUEST_HEADER]: "1" } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "No se pudo completar la acción.");
  return data as T;
}

export const fetchStatus = () => call<LibsStatus>("/api/libs");

export const installWithPnpm = (name: string, version: string) =>
  call<{ name: string; version: string }>("/api/libs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, version }),
  });

export const uninstallWithPnpm = (name: string) =>
  call<{ name: string }>(`/api/libs?name=${encodeURIComponent(name)}`, { method: "DELETE" });
