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

/** Cómo se acomodan las copias de una sección repetida: en una rejilla de `columns` columnas. */
export interface RepeatLayout {
  columns: number;
  /** Espacio entre copias, en px. */
  gap: number;
  /** Columnas propias en tablet y móvil; el dispositivo que falta calcula cuántas caben. */
  columnsOn?: { tablet?: number; mobile?: number };
}

/** Paginación de una sección repetida: se ven `size` elementos por página y una barra para cambiar de página. */
export interface RepeatPaging {
  /** Elementos por página. */
  size: number;
  /** Clave de la respuesta con el total de elementos (para APIs que paginan en el servidor); vacío = se desconoce. */
  totalPath?: string;
  /** Volver a la página 1 cuando cambian los datos. */
  resetOnChange: boolean;
  /** Color de la página actual; por defecto el de acento. */
  accent?: string;
  /** Redondeo de los botones (px). */
  radius?: number;
}

/** Qué parte de un elemento llena el dato. */
export type BoundField = "text" | "src" | "fill" | "color" | "width" | "height";

/** Una clave de una fuente (`articles[0].title`), vacía = la respuesta entera. */
export interface DataRef {
  sourceId: string;
  path: string;
  /** Qué parte del elemento llena; sin él, su texto (o su imagen). */
  as?: BoundField;
  /** Con «ancho» o «alto»: el valor que corresponde a la barra llena (por defecto 100). */
  max?: number;
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
