import type { Library, Page, ComponentDef, SharedFunction, SiteState } from "../../components/site/types.ts";
import type { DesignComment } from "../../components/comments/comment-rules.ts";
import type { DataSource } from "../../components/data-sources/types.ts";
import type { StyleRule, Variable } from "../../components/styles/types.ts";

/**
 * Lo que el editor envía al guardar: solo lo que CAMBIÓ y lo que borró a propósito. Nunca «el sitio entero»:
 * así, guardar no puede borrar lo que otra persona añadió mientras tanto (el editor no lo había visto).
 */
export interface ListPatch<T> {
  /** Lo nuevo y lo modificado (cada uno completo). */
  upsert: T[];
  /** Los ids que la persona eliminó. */
  remove: string[];
  /** La lista de ids en su orden actual; solo si se añadió, quitó o reordenó algo. */
  order?: string[];
}

export interface SitePatch {
  navigation?: SiteState["navigation"];
  /** Las claves sueltas del sitio que no tienen tabla propia (p. ej. la biblioteca de medios). */
  settings?: Record<string, unknown>;
  globalCss?: string;
  pages?: ListPatch<Page>;
  components?: ListPatch<ComponentDef>;
  functions?: ListPatch<SharedFunction>;
  sources?: ListPatch<DataSource>;
  libraries?: ListPatch<Library>;
  comments?: ListPatch<DesignComment>;
  /** Listas pequeñas y sin identidad estable: se reemplazan enteras. */
  variables?: Variable[];
  rules?: StyleRule[];
}

/** El código que no se pudo guardar (por errores de sintaxis): se conserva la última versión válida. */
export interface SaveResult {
  rejectedCode: { where: string; error: string }[];
}
