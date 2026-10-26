import type { ModalOptions } from "../modal/types";

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
      /** Valores ya resueltos de los parámetros de la página de destino (`{ id: "25" }`); solo al seguir el enlace. */
      params?: Record<string, string>;
      /** Si no se indica, se usa la transición por defecto del sitio. */
      transition?: Transition;
    }
  | {
      /** Abre el contenido de una página (con sus parámetros) en una ventana superpuesta, sin navegar. */
      kind: "modal";
      pageId: string;
      params?: Record<string, string>;
      options?: Partial<ModalOptions>;
    }
  /** Cierra la ventana modal abierta. */
  | { kind: "close-modal" }
  | {
      kind: "external";
      /** Vacío mientras se está creando el enlace. */
      url: string;
      newTab: boolean;
    };

/** Los enlaces que apuntan a una página (para ir a ella o para abrirla en una ventana modal). */
export type PageLink = Extract<LinkTarget, { pageId: string }>;

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
