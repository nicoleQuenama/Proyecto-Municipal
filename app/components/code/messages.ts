/** Los mensajes que se intercambian el iframe de la vista previa y el editor. */

/** El iframe avisa de cuánto mide su contenido para ajustar su altura. */
export const SIZE_MESSAGE = "portal:size";
/** El iframe manda lo que se escribe en su consola (console.log, errores…). */
export const LOG_MESSAGE = "portal:log";
/** El iframe avisa qué elemento se está señalando o se seleccionó. */
export const ELEMENT_MESSAGE = "portal:element";
/** El editor pide al iframe que resalte un elemento (por ruta o por selector). */
export const HIGHLIGHT_MESSAGE = "portal:highlight";
/** El editor pide al iframe que quite el resaltado. */
export const CLEAR_MESSAGE = "portal:clear";

export type ConsoleLevel = "log" | "info" | "warn" | "error" | "debug";

export interface ConsoleEntry {
  level: ConsoleLevel;
  text: string;
  at: number;
  /** De qué código viene («Página», «Interacción», «Vista previa»…). */
  source?: string;
}

export interface ElementPick {
  action: "hover" | "select" | "leave";
  /** Posición del elemento dentro del cuerpo, separada por comas (`0,2,1`). */
  path: string;
  tag?: string;
  html?: string;
}

export interface ElementHighlight {
  path?: string;
  selector?: string;
  kind: "hover" | "select";
}
