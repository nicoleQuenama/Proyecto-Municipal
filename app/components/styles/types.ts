/**
 * Motor de estilos del sitio, inspirado en CSS:
 *  - Variables (como `:root`) que se reutilizan en las reglas.
 *  - Reglas por ámbito (todo el sitio < una página < un componente): gana el más específico.
 *  - Reglas por tipo de elemento («todos los botones», «todas las secciones»…).
 */

/** Cajas de componente: se estilan por su categoría. */
export type BlockTarget = "navigation" | "sections" | "cards" | "hero" | "buttons";

/** Elementos dentro de un componente: cada uno declara su rol y sigue las reglas de ese rol. */
export type ElementRole = "heading" | "text" | "button" | "link" | "image" | "container";

export type StyleTarget = "page" | BlockTarget | ElementRole;

export type StyleProp =
  | "padding"
  | "margin"
  | "gap"
  | "background"
  | "radius"
  | "fill"
  | "color"
  | "fontFamily"
  | "fontSize"
  | "fontWeight"
  | "textAlign";

/** Cómo se edita y valida el valor de una propiedad. */
export type PropKind = "size" | "color" | "font" | "weight" | "align";

/** Las variables solo existen para los tipos de valor que tiene sentido reutilizar. */
export type VariableKind = "color" | "size" | "font";

export type StyleScope =
  | { kind: "global" }
  | { kind: "page"; pageId: string }
  | { kind: "component"; componentId: string };

export interface Variable {
  id: string;
  scope: StyleScope;
  /** Sin el prefijo `--`: "color-primario". Se usa como `var(--color-primario)`. */
  name: string;
  kind: VariableKind;
  value: string;
}

/** Valores de un tipo de elemento en un ámbito. Cada valor es literal ("10px") o `var(--nombre)`. */
export interface StyleRule {
  scope: StyleScope;
  target: StyleTarget;
  props: Partial<Record<StyleProp, string>>;
}

export interface StyleState {
  variables: Variable[];
  rules: StyleRule[];
}

/** Lo que se aplica de verdad a un elemento: ya sin variables, solo valores finales. */
export type ResolvedStyle = Partial<Record<StyleProp, string>>;

/** Dónde se está resolviendo: define qué reglas de página y de componente cuentan. */
export interface StyleContext {
  pageId: string;
  componentId?: string;
}
