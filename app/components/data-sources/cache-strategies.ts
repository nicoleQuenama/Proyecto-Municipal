import type { ServerCachePolicy } from "../../server/response-cache";
import type { CacheKind, CacheStrategy } from "./types";

/** Qué hacer con una respuesta guardada: usarla tal cual, usarla y refrescar, o pedir de nuevo. */
export type Freshness = "fresh" | "stale" | "miss";

interface StrategyInfo {
  label: string;
  hint: string;
  /** Cuánto vale lo que ya está en memoria de esta pestaña. */
  check: (age: number, strategy: CacheStrategy) => Freshness;
  /** Qué guarda además el servidor (compartido entre visitantes y, en «persistent», también en disco). */
  server: (strategy: CacheStrategy) => ServerCachePolicy;
}

/** Las estrategias de caché. Una nueva es una entrada nueva. */
export const CACHE_STRATEGIES: Record<CacheKind, StrategyInfo> = {
  swr: {
    label: "Mostrar lo guardado y actualizar (recomendada)",
    hint: "Se ve al instante lo último que llegó y se refresca en segundo plano.",
    check: () => "stale",
    server: () => ({ kind: "none" }),
  },
  ttl: {
    label: "Reutilizar durante un tiempo",
    hint: "El servidor guarda la respuesta y no vuelve a pedirla hasta que pasen los segundos indicados.",
    check: (age, { seconds }) => (age < seconds * 1000 ? "fresh" : "miss"),
    server: ({ seconds }) => ({ kind: "ttl", seconds }),
  },
  session: {
    label: "Una vez por visita",
    hint: "Se pide una sola vez mientras la pestaña siga abierta.",
    check: () => "fresh",
    server: () => ({ kind: "none" }),
  },
  persistent: {
    label: "Guardar en el servidor",
    hint: "La respuesta queda guardada en el servidor (también tras reiniciarlo) hasta que pulses «Probar».",
    check: () => "fresh",
    server: () => ({ kind: "persistent" }),
  },
};

export const DEFAULT_CACHE: CacheStrategy = { kind: "swr", seconds: 60 };

export const freshness = (age: number, strategy: CacheStrategy): Freshness =>
  CACHE_STRATEGIES[strategy.kind].check(age, strategy);

export const serverPolicy = (strategy: CacheStrategy): ServerCachePolicy => CACHE_STRATEGIES[strategy.kind].server(strategy);
