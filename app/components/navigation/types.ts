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

/** Editar el diseño, trazar flechas entre elementos y páginas, o probar la navegación. */
export type NavMode = "edit" | "connect" | "preview";
