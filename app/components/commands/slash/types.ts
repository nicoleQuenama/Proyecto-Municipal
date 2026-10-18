import type { Dispatch } from "react";
import type { BuilderTarget } from "../../builder/component-builder";
import type { SiteAction, SiteState } from "../../site/types";

/** Una opción de una lista. Al elegirla se ejecuta; si devuelve un paso, la paleta continúa con él. */
export interface Suggestion {
  id: string;
  label: string;
  hint?: string;
  run: () => Step | void;
}

/** Elegir de una lista que se filtra al escribir. */
export interface ListStep {
  kind: "list";
  placeholder: string;
  suggestions: Suggestion[];
}

/** Escribir un texto. `submit` devuelve el siguiente paso, un mensaje de error, o nada si terminó. */
export interface PromptStep {
  kind: "prompt";
  placeholder: string;
  initial?: string;
  submit: (text: string) => Step | string | void;
}

export type Step = ListStep | PromptStep;

/** Lo que los comandos pueden leer y hacer en la app. */
export interface SlashContext {
  site: SiteState;
  dispatch: Dispatch<SiteAction>;
  openBuilder: (target: BuilderTarget) => void;
  /** Va a una página y, si se indica, selecciona un bloque y lo muestra. */
  goTo: (pageId: string, blockId?: string) => void;
  /** Quita un medio de la página actual (libera su archivo local). */
  removeMedia: (mediaId: string) => void;
}

/** Un comando que se escribe con «/»: su nombre, qué hace y su primer paso. */
export interface Verb {
  name: string;
  description: string;
  start: () => Step;
}
