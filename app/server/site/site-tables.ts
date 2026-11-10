/**
 * Cada tabla del sitio descrita como datos: qué columna guarda qué campo de las filas de `rows.ts`.
 * Añadir una tabla o una columna es añadir una entrada aquí; la lectura y la escritura (`site-sql.ts`) son genéricas.
 */
export interface Column {
  column: string;
  /** El nombre del campo en `rows.ts` (camelCase). */
  field: string;
  /** El tipo con que se lee del JSON que viaja a la base de datos. */
  type: string;
  /** false = se escribe al crear la fila, pero nunca se cambia después (el orden de las listas, el autor…). */
  update?: boolean;
  /** Cómo se construye el valor a partir del campo (por defecto, tal cual). */
  expr?: string;
}

export interface TableDef {
  table: string;
  /** Las columnas que identifican la fila dentro del proyecto (la organización y el proyecto van siempre). */
  key: string[];
  columns: Column[];
  /** Una columna extra solo de lectura (p. ej. el nombre del autor de un comentario). */
  readExtra?: string;
}

const col = (column: string, field: string, type = "text", extra: Partial<Column> = {}): Column => ({ column, field, type, ...extra });
/** El orden de una lista que se reordena aparte (`applyOrder`): al guardar el contenido de una fila no se toca. */
const listPosition = col("position", "position", "int", { update: false });
/** El orden de lo que viaja completo dentro de su página: se guarda con ella. */
const childPosition = col("position", "position", "int");

export const PAGES: TableDef = {
  table: "pages",
  key: ["id"],
  columns: [col("id", "id"), col("name", "name"), col("slug", "slug"), col("is_home", "isHome", "boolean"), col("unit_id", "unitId", "uuid"), col("role", "role"), listPosition, col("hidden", "hidden", "boolean"), col("route", "route"), col("title", "title", "jsonb"), col("settings", "settings", "jsonb")],
};

export const BLOCKS: TableDef = {
  table: "blocks",
  key: ["id"],
  columns: [col("id", "id"), col("page_id", "pageId"), col("component_id", "componentId"), childPosition, col("hidden", "hidden", "boolean"), col("locked", "locked", "boolean"), col("slot", "slot"), col("scope", "scope"), col("format", "format", "jsonb")],
};

export const MEDIA: TableDef = {
  table: "media_items",
  key: ["id"],
  columns: [col("id", "id"), col("page_id", "pageId"), childPosition, col("kind", "kind"), col("src", "src"), col("embed", "embed", "boolean"), col("alt", "alt"), col("hidden", "hidden", "boolean"), col("poster", "poster"), col("placement", "placement", "jsonb"), col("settings", "settings", "jsonb")],
};

export const ANIMATIONS: TableDef = {
  table: "animations",
  key: ["id"],
  columns: [col("id", "id"), col("page_id", "pageId"), col("name", "name"), childPosition],
};

export const STEPS: TableDef = {
  table: "animation_steps",
  key: ["animation_id", "id"],
  columns: [
    col("animation_id", "animationId"),
    col("id", "id"),
    col("block_id", "blockId"),
    col("key", "key"),
    col("prop", "prop"),
    col("from_value", "from", "jsonb"),
    col("to_value", "to", "jsonb"),
    col("start_ms", "start", "int"),
    col("duration_ms", "duration", "int"),
    col("easing", "easing"),
    col("iterations", "iterations", "int"),
    col("direction", "direction"),
    childPosition,
  ],
};

export const COMPONENTS: TableDef = {
  table: "components",
  key: ["id"],
  columns: [
    col("id", "id"),
    col("name", "name"),
    col("description", "description"),
    col("category", "category"),
    col("width", "width", "int"),
    col("height", "height", "int"),
    col("elements", "elements", "jsonb"),
    col("links", "links", "jsonb"),
    col("styles", "styles", "jsonb"),
    col("custom", "custom", "boolean"),
    col("drawn", "drawn", "boolean"),
    listPosition,
    col("settings", "settings", "jsonb"),
  ],
};

export const VARIABLES: TableDef = {
  table: "style_variables",
  key: ["id"],
  columns: [col("id", "id"), col("scope", "scope"), col("page_id", "pageId"), col("component_id", "componentId"), col("name", "name"), col("kind", "kind"), col("value", "value"), childPosition],
};

/** Las reglas no tienen id propio (las identifica su ámbito y objetivo): se reemplazan enteras, por eso no hay clave. */
export const RULES: TableDef = {
  table: "style_rules",
  key: [],
  columns: [col("scope", "scope"), col("page_id", "pageId"), col("component_id", "componentId"), col("target", "target"), col("props", "props", "jsonb"), childPosition],
};

export const FUNCTIONS: TableDef = {
  table: "shared_functions",
  key: ["id"],
  columns: [col("id", "id"), col("name", "name"), col("scope_kind", "scopeKind"), col("block_id", "blockId"), col("element_id", "elementId"), listPosition],
};

export const SOURCES: TableDef = {
  table: "data_sources",
  key: ["id"],
  columns: [
    col("id", "id"),
    col("name", "name"),
    col("url", "url"),
    col("method", "method"),
    col("query", "query", "jsonb"),
    // Las cabeceras viajan ya cifradas (base64) y se guardan como bytea.
    col("headers_enc", "headersEnc", "text", { expr: `decode(r."headersEnc", 'base64')` }),
    col("cache_kind", "cacheKind"),
    col("cache_seconds", "cacheSeconds", "int"),
    listPosition,
  ],
};

export const LIBRARIES: TableDef = {
  table: "project_libraries",
  key: ["id"],
  columns: [col("id", "id"), col("name", "name"), col("version", "version"), col("source", "source"), listPosition],
};

export const COMMENTS: TableDef = {
  table: "design_comments",
  key: ["id"],
  columns: [
    col("id", "id"),
    col("page_id", "pageId"),
    col("author_id", "authorId", "uuid", { update: false }),
    col("x", "x", "numeric"),
    col("y", "y", "numeric"),
    col("body", "body"),
    col("audience", "audience"),
    col("resolved", "resolved", "boolean"),
    col("created_at", "createdAt", "timestamptz", { update: false }),
    listPosition,
  ],
  readExtra: `(select u.name from app.users u where u.id = design_comments.author_id) as author`,
};
