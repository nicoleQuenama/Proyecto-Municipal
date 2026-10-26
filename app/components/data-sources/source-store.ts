import { freshness } from "./cache-strategies";
import { requestKey, type PageParams } from "./build-request";
import { fetchSource } from "./fetch-source";
import type { DataSource, SourceState } from "./types";

/** Respuestas por petición, fuera de React: varias piezas que usan la misma fuente comparten una sola petición. */
const states = new Map<string, SourceState>();
const pending = new Set<string>();
const listeners = new Set<() => void>();
const IDLE: SourceState = { status: "idle" };

const emit = () => listeners.forEach((listener) => listener());

function set(key: string, state: SourceState) {
  states.set(key, state);
  emit();
}

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

export const peek = (source: DataSource, params: PageParams = {}): SourceState =>
  states.get(requestKey(source, params)) ?? IDLE;

/** Trae la fuente respetando su estrategia de caché; `force` ignora lo guardado (el botón «Probar»). */
export function load(source: DataSource, force = false, params: PageParams = {}): void {
  const key = requestKey(source, params);
  const known = states.get(key) ?? IDLE;
  const state = known.status === "ready" ? freshness(Date.now() - known.at, source.cache) : "miss";
  if ((!force && state === "fresh") || pending.has(key)) return;

  // Con datos ya guardados se siguen enseñando mientras llegan los nuevos.
  const previous = known.status === "ready" ? known.data : undefined;
  if (known.status !== "ready") set(key, { status: "loading" });

  pending.add(key);
  fetchSource(source, force, params)
    .then((data) => set(key, { status: "ready", data, at: Date.now() }))
    .catch((error) => set(key, { status: "error", message: error instanceof Error ? error.message : "Error", data: previous }))
    .finally(() => void pending.delete(key));
}
