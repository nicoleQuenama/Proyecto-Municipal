"use client";

import { REQUEST_HEADER } from "../../server/request-header";

/**
 * Las preferencias de la persona (atajos, inspector, modo avanzado) viven en la base de datos y le siguen a cualquier
 * dispositivo. Aquí hay una copia en memoria para que la interfaz las lea al instante; cada cambio se guarda en el servidor
 * poco después. Es un store externo (`useSyncExternalStore`).
 */
const URL_OF = "/api/cms/preferences";
const HEADERS = { "content-type": "application/json", [REQUEST_HEADER]: "1" };
const SAVE_DELAY_MS = 500;

let values: Record<string, unknown> = {};
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

const notify = () => listeners.forEach((listener) => listener());

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** Pide las preferencias una sola vez (sin sesión, como en el visor del sitio publicado, no hay ninguna). */
export function loadPreferences(): Promise<void> {
  if (typeof window === "undefined" || new URLSearchParams(window.location.search).has("fresh")) return Promise.resolve();
  loading ??= fetch(URL_OF, { headers: HEADERS })
    .then((response) => (response.ok ? (response.json() as Promise<{ preferences: Record<string, unknown> }>) : null))
    .then((body) => {
      if (body) values = { ...body.preferences, ...values };
    })
    .catch(() => undefined)
    .finally(() => {
      loaded = true;
      notify();
    });
  return loading;
}

export const isLoaded = (): boolean => loaded;

export const getPreference = <T,>(key: string, fallback: T): T => (key in values ? (values[key] as T) : fallback);

export function setPreference(key: string, value: unknown): void {
  if (JSON.stringify(values[key]) === JSON.stringify(value)) return;
  values = { ...values, [key]: value };
  notify();

  clearTimeout(timers.get(key));
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      fetch(URL_OF, { method: "PUT", headers: HEADERS, body: JSON.stringify({ key, value }) }).catch(() => undefined);
    }, SAVE_DELAY_MS),
  );
}
