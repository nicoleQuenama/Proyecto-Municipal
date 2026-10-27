/** Dónde se pone el degradado: toda la página, una sección o un elemento de una sección. */
export type GradientTarget =
  | { kind: "page"; pageId: string }
  | { kind: "block"; pageId: string; blockId: string }
  | { kind: "element"; pageId: string; blockId: string; elementId: string };
