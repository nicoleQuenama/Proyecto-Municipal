/** Cuánto vale una respuesta guardada. Una estrategia nueva es una entrada nueva en `cache-strategies.ts`. */
export type CacheKind = "swr" | "ttl" | "session" | "persistent";

export interface CacheStrategy {
  kind: CacheKind;
  /** Solo para «ttl»: cuántos segundos se reutiliza la respuesta. */
  seconds: number;
}

export type HttpMethod = "GET" | "POST";

export interface QueryParam {
  key: string;
  value: string;
}

/** Una API del proyecto: a dónde se pide, con qué parámetros y cómo se guarda lo que responde. */
export interface DataSource {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  query: QueryParam[];
  /** Cabeceras (p. ej. Authorization); viajan por el proxy del servidor. */
  headers: QueryParam[];
  /** TypeScript opcional: `(data) => data.articles` — da forma a la respuesta antes de enlazarla. */
  transform: string;
  cache: CacheStrategy;
}

/** Una clave de una fuente (`articles[0].title`), vacía = la respuesta entera. */
export interface DataRef {
  sourceId: string;
  path: string;
}

/** Lo que devuelve el proxy: el cuerpo tal cual y su tipo. */
export interface RawResponse {
  status: number;
  contentType: string;
  body: string;
}

export type SourceState =
  | { status: "idle"; data?: undefined }
  | { status: "loading"; data?: unknown }
  | { status: "ready"; data: unknown; at: number }
  | { status: "error"; message: string; data?: unknown };

/** Lo que viaja al arrastrar una clave: a dónde apunta y si es una lista (va a secciones) o un dato (va a elementos). */
export type DragPayload = DataRef & { isList: boolean };

/** Tipo de dato del arrastre desde la pestaña Datos. */
export const DRAG_TYPE = "application/x-data-ref";
