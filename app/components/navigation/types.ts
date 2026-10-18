export type TransitionKind = "none" | "fade" | "slide" | "zoom";

/** Cómo se anima el paso de una página a otra. */
export interface Transition {
  kind: TransitionKind;
  seconds: number;
}

/** A dónde lleva un elemento. Sin enlace, el elemento es solo contenido (texto, imagen…). */
export type LinkTarget =
  | {
      kind: "page";
      pageId: string;
      /** Si no se indica, se usa la transición por defecto del sitio. */
      transition?: Transition;
    }
  | {
      kind: "external";
      /** Vacío mientras se está creando el enlace. */
      url: string;
      newTab: boolean;
    };

export interface Point {
  x: number;
  y: number;
}

/** Editar el diseño (y enlazar elementos con páginas) o probar la navegación como un visitante. */
export type NavMode = "edit" | "preview";

/** Un elemento de un componente, que es lo que se enlaza. */
export interface ElementRef {
  componentId: string;
  elementId: string;
}

/** El elemento cuyo enlace se está editando y dónde mostrar el editor. */
export interface LinkEditorTarget extends ElementRef {
  anchor: Point;
}
